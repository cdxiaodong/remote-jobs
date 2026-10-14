# data 契约(AI 产出「字段值」,脚本负责其余一切)

## AI 每轮要做的事

采集筛选完 → 把通过硬过滤的职位写成「字段值数组」喂给脚本,一行命令完成入库+push:

```bash
python3 scripts/merge_jobs.py merge -i /tmp/new_jobs.jsonl
```

输出一行 JSON(`added/updated/dropped/.../git`),报告里直接引用。

## 字段值规格(字段名照抄,值填对即可,其余脚本兜底)

必填 5 项(缺一该条丢弃):

| 字段 | 值规则 |
|---|---|
| id | jike → `jike-<originalPosts/后的id>`;其余平台 → URL 短 hash(10位) |
| source | `"jike"` 或 `"easynomad"`(只有这两个枚举) |
| title | 职位名,纯文本 |
| url | http(s) 完整链接 |
| publishedAt | ISO 8601 带时区,如 `2026-10-14T10:00:00+08:00` |

选填(缺省时脚本按默认处理):

| 字段 | 枚举/规则 |
|---|---|
| category | `high_value` / `quick_win` / `normal`(默认 normal) |
| jobType | `full_remote` / `parttime` / `project` / `unknown`(默认 unknown) |
| tags | 只收 13 词表:`AI/LLM Agent RAG 爬虫/数据采集 自动化 全栈 前端 后端 DevOps/云 移动端 数据/分析 安全 其他` |
| company / sourceName / description / salaryText | 纯文本;description 超 2000 字截断;换行压成空格 |

## 脚本确定性规则(不用 AI 记)

- 按 id 去重:新数据 ≥ 旧 publishedAt → 覆盖(旧已 expired 保持 expired)
- 发布超 30 天 → `status: expired`(每轮全库重算,含存量)
- active 超 500 → 按发布时间降序留最新 500,更旧物理删除
- commit 格式 `data: update YYYY-MM-DD +N`;push 失败自动 `pull --rebase` 重试 1 次
- 任何一条脏数据只丢该条(dropped 计数),不阻塞其他条目

## 为什么这样设计(减 token / 少代码)

- AI 只产出**字段值**——不需要在 prompt 里写合并规则、去重规则、过期规则、commit 规则,全部沉淀进脚本
- 前端 `lib/jobs.ts normalize()` 与本脚本兜底逻辑一致,前端遇非法值自动降级,双保险
- 报告环节只引用脚本输出的一行 JSON,不重复统计
