# 远程好单

面向中文程序员的远程兼职 / 副业职位聚合站。Next.js 15（App Router）+ TypeScript + Tailwind CSS v4，纯静态生成（SSG），部署在 Vercel。

- 无数据库、无 API 路由、无 serverless 函数
- 唯一数据源：仓库内 `data/jobs.json`，build 时读取
- 外部采集任务每天更新该文件并 push → Vercel 自动重新构建

## 目录结构

```
.
├── app/
│   ├── layout.tsx            # 根布局、全站 metadata、主色注入
│   ├── globals.css           # Tailwind v4 入口、小红书红白灰配色 token（含暗色）、标签/开关/提示/动效样式
│   ├── page.tsx              # / 职位流
│   ├── weekly/page.tsx       # /weekly 本周精选
│   ├── about/page.tsx        # /about 说明与免责
│   ├── opengraph-image.tsx   # 构建时生成 OG 图
│   ├── robots.ts             # /robots.txt
│   ├── sitemap.ts            # /sitemap.xml
│   ├── not-found.tsx
│   └── icon.svg
├── components/
│   ├── JobFeed.tsx           # 首页：搜索、吸顶分类 tab + 技术标签、单列列表、滚动自动加载、URL 同步
│   ├── JobCard.tsx           # 职位卡片（标签、标题、描述、#话题、来源头像、红色薪资）
│   ├── FeedSkeleton.tsx      # 首次加载骨架
│   ├── RelativeTime.tsx      # 浏览器端相对时间
│   ├── SiteHeader.tsx        # 顶栏（下滑隐藏、上滑出现，红色下划线标当前页）
│   ├── SiteFooter.tsx
│   ├── XhsCta.tsx            # 小红书关注卡 + 一键复制账号 + 居中提示（未配置 XHS_ACCOUNT 时不渲染）
│   ├── BackToTop.tsx         # 回到顶部按钮
│   ├── TicketMark.tsx        # 站点标志
│   └── icons.tsx             # 内联 SVG 图标
├── lib/
│   ├── job-utils.ts          # 类型、标签词表、筛选、时间格式化、薪资折算（前后端共用）
│   ├── jobs.ts               # 读取并清洗 data/jobs.json（仅服务端/构建期）
│   └── config.ts             # 环境变量与缺省值
├── data/jobs.json            # 数据文件（当前为 seed）
├── .env.example
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## 本地开发

需要 Node.js 20+。

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 生产构建，确认能通过
npm run start        # 预览构建产物（含 /opengraph-image）
```

第一次 `npm install` 后请把生成的 `package-lock.json` 一起提交，保证 Vercel 安装版本一致。

## 部署到 Vercel

1. 把本仓库推到 GitHub。
2. Vercel 控制台 → Add New → Project → 选择该仓库。
3. Framework Preset 选 **Next.js**（会自动识别），其余保持默认，点击 Deploy。
4. 不配置任何环境变量也能构建成功。需要时在 Project → Settings → Environment Variables 添加：

| 变量 | 作用 | 缺省 |
| --- | --- | --- |
| `SITE_NAME` | 站名（页头、标题、OG 图） | `远程好单` |
| `SITE_URL` | 正式域名，用于 canonical / sitemap / OG 绝对地址，如 `https://jobs.example.com` | Vercel 生产域名，本地为 `http://localhost:3000` |
| `XHS_ACCOUNT` | 运营者小红书号名称，用于页脚和关于页的关注引导 | 空 = 引导区隐藏 |
| `CONTACT_NOTE` | 引导区的私信文案 | 内置默认文案 |
| `PRIMARY_COLOR` | 主色，6 位十六进制。按钮、薪资、选中态、开关、本周精选头图都用它 | `#ff2442`（小红书红） |

环境变量在**构建时**读取，修改后需在 Vercel 上 Redeploy 才生效。代码中不包含任何微信号或二维码。

5. 绑定自定义域名后记得把 `SITE_URL` 改成该域名并重新部署。

> **国内访问**：`*.vercel.app` 域名在中国大陆普遍无法直接打开。访客主要来自小红书 / 微信，上线前务必在 Project → Settings → Domains 绑定自己的域名，再把 `SITE_URL` 设为它。

## 数据文件说明

> 当前 `data/jobs.json` 是 **22 条开发用 seed 数据**（内容虚构，链接不可用），上线前会被外部采集任务产出的真实数据替换。

- `data/jobs.json` 由**外部采集定时任务每日自动更新**并 push 到本仓库，commit 格式：`data: update YYYY-MM-DD +N`（N 为新增条数）。
- **前端开发者请勿手动修改该文件**，否则会与采集任务的提交冲突。
- 每次 push 触发 Vercel 自动重新构建，首页、本周精选、OG 图都会随之更新。
- 字段契约见任务说明，前端严格按契约消费。为防止一条脏数据拖垮整站，构建时会静默丢弃：缺 `id`/`title`、`url` 非 http(s)、`publishedAt` 无法解析的条目；重复 `id` 只保留第一条；未知的 `category`/`jobType`/标签会被归为 `normal`/`unknown`/剔除。
- **JSON 格式错误会导致 build 失败**（构建日志会提示 `data/jobs.json 读取或解析失败`）。快速校验：

```bash
python3 -m json.tool data/jobs.json > /dev/null && echo OK
# 或
npm run check:data
```

页面行为与数据的关系：

- `/`：按 `publishedAt` 倒序，默认隐藏 `status=expired`（可勾选"显示已过期"）。标签多选为"任一命中"，关键词按空格拆分后需全部命中，匹配范围为标题、公司、描述、薪资、标签。
- `/weekly`：以 `updatedAt` 为基准取最近 7 天、`category=high_value` 且未过期的职位，按 `salaryText` 折算的月度等价金额从高到低排序（时薪 ×160、日薪 ×21.75、年薪 ÷12、美元 ×7，无法解析的排后面）。
- 首页为控制页面体积，下发给浏览器的描述截断到 300 字。

## 常见故障排查

| 现象 | 原因与处理 |
| --- | --- |
| Vercel 构建失败，日志含 `data/jobs.json 读取或解析失败` | JSON 语法错误。本地 `python3 -m json.tool data/jobs.json` 定位行号，通知采集端修复后重新 push。 |
| push 了数据但网站没更新 | 在 Vercel Deployments 查看是否触发构建；确认 push 的是 Production Branch（通常为 `main`）；浏览器强刷。 |
| 本周精选为空 | 最近 7 天（相对 `updatedAt`）没有 `high_value` 职位，或 `updatedAt` 很久未更新。 |
| 首页一直是骨架屏 | 浏览器禁用了 JavaScript，或脚本报错。打开控制台查看错误。 |
| 国内手机打不开网站 | 用的是 `*.vercel.app` 域名。绑定自定义域名后再分享。 |
| OG 图中文变成方块 / 显示英文 | OG 图构建时会从 Google Fonts 拉取中文字体子集；构建环境无法访问时自动降级为英文版式，不影响构建。Vercel 正常可访问。 |
| 分享到微信不显示卡片图 | 微信聊天的链接卡片不读取 OG 标签（需公众号 JS-SDK），这是平台限制；OG 图对浏览器、Telegram、Slack、搜索引擎等生效。 |
| canonical / sitemap 里是 `localhost` 或 vercel.app 域名 | 没有设置 `SITE_URL`，设置后重新部署。 |
| 改了环境变量没生效 | 环境变量在构建时注入，需要 Redeploy。 |

## 验收自测清单

- [ ] `npm run dev`，首页用 seed 数据正常渲染，显示 20 条在招（2 条 expired 被隐藏）
- [ ] 分类 tab（全部 / 高价值 / 快速变现）切换正确，tab 上的数量随标签和关键词变化
- [ ] 单列卡片列表；卡片上红底"高价值"、浅红"快速变现"标签，蓝色 #话题，底部来源头像和红色薪资；按下卡片有灰色按压反馈
- [ ] 分类 tab 当前项加粗并带红色短下划线；技术标签是灰色胶囊，选中变浅红底红字带对勾（手机上横向滑动，桌面端换行铺开）
- [ ] 关键词搜索约 300ms 后生效；桌面端按 `/` 聚焦搜索框
- [ ] 往下滚动时顶栏收起、分类条贴到最顶；往上滚动顶栏重新出现；分类条吸顶时切换条件，列表回到开头
- [ ] 滚动超过一屏多出现"回到顶部"按钮
- [ ] 筛选后地址栏出现 `?cat=...&tags=...&q=...`，复制链接到新标签页打开，筛选状态一致
- [ ] 打开"显示已过期"开关（打开后变红）出现 2 条带"已过期"标记的半透明卡片，URL 带 `expired=1`
- [ ] 分页：数据超过 20 条时，滚到底部附近自动追加 20 条（也可以点"加载更多"）；改变筛选会回到前 20 条
- [ ] 筛选到无结果时显示"暂无符合条件的职位"和"清除筛选"按钮
- [ ] 首次加载（或 DevTools 节流到 Slow 3G）可见骨架屏
- [ ] 超长标题最多两行截断，空描述的卡片不出现空行
- [ ] 卡片点击在新标签页打开原文链接
- [ ] DevTools 设为 375px 宽，所有页面无横向滚动条
- [ ] 系统切换暗色模式，页面随之变暗且文字可读
- [ ] `/weekly` 页头为"本周 7 个高价值好单，每日更新"，列表只含 10-07 09:00 之后发布的 high_value，按金额从高到低，前三名的名次是红色
- [ ] `npm run build && npm run start` 后访问 `/opengraph-image`，看到站名 + 在招数 + 日期的图片
- [ ] 查看页面源码，`<link rel="canonical">` 分别为 `/`、`/weekly`、`/about` 对应的绝对地址；`/robots.txt`、`/sitemap.xml` 可访问
- [ ] 不设 `XHS_ACCOUNT` 时页脚没有小红书引导；设置后每页底部出现关注卡，点"复制账号"屏幕中央提示"已复制，打开小红书搜索即可"
- [ ] 把 `data/jobs.json` 改成 `{"updatedAt":"2026-10-14T09:00:00+08:00","jobs":[]}` 后 `npm run build` 成功，首页显示空状态、`/weekly` 显示"本周暂无高价值好单"，OG 图显示 0 个职位
- [ ] `npm run build` 输出中所有路由标记为 ○（Static）
