#!/usr/bin/env python3
"""远程好单数据合并入库脚本(AI 定时任务专用入口)

设计目标:AI 每轮只产出「字段值数组」(JSON lines 或 JSON 数组)喂给本脚本,
校验、兜底、去重、过期、截断、排序、写文件、commit、push 全部由脚本确定性完成。
任何一条脏数据只丢弃该条并计数,不阻塞其他条目,流程永不因单条失败而中断。

用法(在仓库根目录执行):
  python3 scripts/merge_jobs.py merge -i /tmp/new_jobs.jsonl
  echo '[{...}]' | python3 scripts/merge_jobs.py merge -      # stdin
  python3 scripts/merge_jobs.py merge -i x.jsonl --dry-run    # 预演不写库
  python3 scripts/merge_jobs.py status                        # 只看当前库状态
  python3 scripts/merge_jobs.py rebuild                       # 只重算过期/截断,不新增

输入条目契约(与前端 lib/job-utils.ts Job 接口一致;全部字段可缺省,脚本兜底):
  id          必填,全局唯一;jike 条目用 jike-<originalPosts/后的id>,其余用 URL 短 hash
  source      必填,"jike" | "easynomad";其他值按 jike 兜底(与前端一致)
  title       必填,职位名
  url         必填,http(s) 链接
  publishedAt 必填,ISO 8601 带时区
  company / description / salaryText / sourceName 可缺省(description 截到 2000 字)
  category    high_value / quick_win / normal(默认 normal)
  jobType     full_remote / parttime / project / unknown(默认 unknown)
  tags        13 词表内才收录;缺省空数组
  status      active / expired(默认 active;脚本按 30 天规则自动置 expired)

输出:单行 JSON(stdout),含 added/updated/skipped/dropped 等计数与 git 结果,
报告环节直接引用这行即可。
"""

import argparse
import datetime
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / 'data' / 'jobs.json'

TAGS = [
    'AI/LLM', 'Agent', 'RAG', '爬虫/数据采集', '自动化', '全栈', '前端', '后端',
    'DevOps/云', '移动端', '数据/分析', '安全', '其他',
]
SOURCES = ('jike', 'easynomad')
CATEGORIES = ('high_value', 'quick_win', 'normal')
JOB_TYPES = ('full_remote', 'parttime', 'project', 'unknown')
DAY_MS = 86_400_000
MAX_ACTIVE = 500   # active 总量上限,更旧的物理删除
MAX_DESC = 2000    # description 字数上限(与 SKILL.md 契约一致)
EXPIRE_DAYS = 30   # 发布超 30 天自动置 expired


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S+08:00', time.localtime())


def ts(iso: str) -> float | None:
    """ISO 时间串 → 秒级时间戳;解析失败返回 None。"""
    if not isinstance(iso, str) or not iso:
        return None
    try:
        dt = datetime.datetime.fromisoformat(iso.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone(datetime.timedelta(hours=8)))
        return dt.timestamp()
    except ValueError:
        return None


def norm_text(v) -> str:
    """文本清洗:非串置空;去 BOM/首尾空白,内部换行压成空格。"""
    if not isinstance(v, str):
        return ''
    return ' '.join(v.strip().lstrip('﻿').replace('\r', ' ').split())


def url_id(url: str) -> str:
    import hashlib
    return hashlib.sha1(url.strip().encode()).hexdigest()[:10]


def normalize(item) -> dict | None:
    """单条规整;返回 None 表示该条不可用(缺硬字段/时间非法)。"""
    if not isinstance(item, dict):
        return None
    jid = norm_text(item.get('id'))
    title = norm_text(item.get('title'))
    url = (item.get('url') or '').strip()
    published = norm_text(item.get('publishedAt'))
    if not jid or not title or not url or ts(published) is None:
        return None
    if not url.lower().startswith(('http://', 'https://')):
        return None
    source = item.get('source')
    source = source if source in SOURCES else 'jike'
    return {
        'id': jid,
        'source': source,
        'sourceName': norm_text(item.get('sourceName')) or (
            '即刻·招聘发布市场' if source == 'jike' else '轻松游牧'),
        'title': title,
        'company': norm_text(item.get('company')),
        'description': norm_text(item.get('description'))[:MAX_DESC],
        'url': url,
        'category': item.get('category') if item.get('category') in CATEGORIES else 'normal',
        'tags': [t for t in (item.get('tags') or []) if isinstance(t, str) and t in TAGS],
        'jobType': item.get('jobType') if item.get('jobType') in JOB_TYPES else 'unknown',
        'salaryText': norm_text(item.get('salaryText')),
        'publishedAt': published,
        'status': 'active',
    }


def load_new(path: str) -> list:
    """读入本轮新条目:JSON 数组或 JSON lines 都收;单行坏只丢该行。"""
    raw = sys.stdin.read() if path == '-' else Path(path).read_text(encoding='utf-8')
    raw = raw.strip()
    if not raw:
        return []
    try:
        obj = json.loads(raw)
        return obj if isinstance(obj, list) else [obj]
    except json.JSONDecodeError:
        items = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return items


def load_current() -> list:
    try:
        data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    except Exception as e:
        print(json.dumps({'ok': False, 'error': f'读取 data/jobs.json 失败: {e}'}, ensure_ascii=False))
        sys.exit(1)
    jobs = data.get('jobs')
    return jobs if isinstance(jobs, list) else []


def key_ts(job: dict) -> float:
    return ts(job.get('publishedAt', '')) or 0.0


def merge(items: list) -> tuple[list, dict]:
    """合并核心:现有条目为基,新条目覆盖或追加;返回(新列表, 统计)。"""
    stats = {'input': len(items), 'added': 0, 'updated': 0, 'skippedOlder': 0, 'dropped': 0}
    merged: dict[str, dict] = {}
    for job in load_current():
        if isinstance(job, dict) and job.get('id'):
            merged.setdefault(job['id'], job)
    now_ms = time.time() * 1000

    for item in items:
        job = normalize(item)
        if job is None:
            stats['dropped'] += 1
            continue
        # 30 天规则:发布距今超 30 天,入池即置 expired
        if now_ms - key_ts(job) * 1000 > EXPIRE_DAYS * DAY_MS:
            job['status'] = 'expired'
        old = merged.get(job['id'])
        if old is None:
            merged[job['id']] = job
            stats['added'] += 1
        elif key_ts(job) >= key_ts(old):
            # 新数据不旧于旧数据 → 覆盖;但旧条目已 expired 则保留 expired
            if old.get('status') == 'expired':
                job['status'] = 'expired'
            merged[job['id']] = job
            stats['updated'] += 1
        else:
            stats['skippedOlder'] += 1

    # 全库重算过期:不因本轮没重采就漏掉自然超龄的存量条目
    for job in merged.values():
        if now_ms - key_ts(job) * 1000 > EXPIRE_DAYS * DAY_MS:
            job['status'] = 'expired'

    # 截断:active 超 MAX_ACTIVE 时,按发布时间降序保留最新 500,更旧的物理删除
    all_jobs = list(merged.values())
    active = [j for j in all_jobs if j.get('status') == 'active']
    removed = 0
    if len(active) > MAX_ACTIVE:
        active.sort(key=key_ts, reverse=True)
        keep_ids = {j['id'] for j in active[:MAX_ACTIVE]}
        dropped_old = [j for j in active if j['id'] not in keep_ids]
        removed = len(dropped_old)
        drop_ids = {j['id'] for j in dropped_old}
        all_jobs = [j for j in all_jobs if j['id'] not in drop_ids]
    all_jobs.sort(key=key_ts, reverse=True)
    stats['removedOverflow'] = removed
    stats['total'] = len(all_jobs)
    stats['active'] = sum(1 for j in all_jobs if j.get('status') == 'active')
    return all_jobs, stats


def validate_json(path: Path) -> bool:
    r = subprocess.run([sys.executable, '-m', 'json.tool', str(path)],
                       capture_output=True, text=True, timeout=30)
    return r.returncode == 0


def git(*args: str) -> tuple[bool, str]:
    r = subprocess.run(['git', '-C', str(ROOT), *args],
                       capture_output=True, text=True, timeout=120)
    return r.returncode == 0, (r.stdout + r.stderr).strip()


def save(jobs: list, stats: dict, dry: bool, push: bool) -> dict:
    stats = dict(stats)
    stats['ok'] = True
    if dry:
        stats['dryRun'] = True
        return stats
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        json.dumps({'updatedAt': now_iso(), 'jobs': jobs},
                   ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if not validate_json(DATA_FILE):
        print(json.dumps({'ok': False, 'error': 'JSON 校验失败,请检查 data/jobs.json'}, ensure_ascii=False))
        sys.exit(1)
    # 无新增也无结构变化时不空转 commit(pull --rebase 产生的对齐除外,由 git 判断)
    ok, out = git('status', '--porcelain', '--', 'data/jobs.json')
    changed = bool(out.strip()) if ok else True
    if not changed:
        stats['git'] = 'no-change'
        return stats
    date = time.strftime('%Y-%m-%d')
    ok, out = git('add', 'data/jobs.json')
    if not ok:
        stats['git'] = f'add 失败: {out[:200]}'
        return stats
    ok, out = git('commit', '-m', f'data: update {date} +{stats.get("added", 0)}')
    if not ok:
        stats['git'] = f'commit 失败: {out[:200]}'
        return stats
    if not push:
        stats['git'] = f'committed (未 push) +{stats.get("added", 0)}'
        return stats
    ok, out = git('push')
    if ok:
        stats['git'] = f'pushed +{stats.get("added", 0)}'
    else:
        ok2, out2 = git('pull', '--rebase')
        if ok2:
            ok2, out2 = git('push')
        stats['git'] = f'pushed(retry) +{stats.get("added", 0)}' if ok2 else f'push 失败(已 commit): {out[:200]}'
    return stats


def main() -> None:
    ap = argparse.ArgumentParser(description='远程好单 jobs.json 合并入库')
    ap.add_argument('command', choices=['merge', 'status', 'rebuild'])
    ap.add_argument('-i', '--input', default='-',
                    help='输入文件路径,- 表示 stdin(rebuild 时忽略)')
    ap.add_argument('--dry-run', action='store_true', help='只预演不写库不 commit')
    ap.add_argument('--no-push', dest='push', action='store_false',
                    help='只 commit 不 push')
    args = ap.parse_args()

    if args.command == 'status':
        jobs = load_current()
        active = [j for j in jobs if j.get('status') == 'active']
        now_ms = time.time() * 1000
        print(json.dumps({
            'ok': True,
            'total': len(jobs),
            'active': len(active),
            'expired': len(jobs) - len(active),
            'newToday': sum(1 for j in active if now_ms - key_ts(j) * 1000 < DAY_MS),
        }, ensure_ascii=False))
        return

    if args.command == 'rebuild':
        # rebuild = 空输入 merge:只重算过期/截断,不新增
        jobs, stats = merge([])
    else:
        items = load_new(args.input)
        jobs, stats = merge(items)
    print(json.dumps(save(jobs, stats, args.dry_run, args.push), ensure_ascii=False))


if __name__ == '__main__':
    main()
