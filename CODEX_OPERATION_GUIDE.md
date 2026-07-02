# Codex 后续开发与运维指令文档

## 1. 项目定位

本仓库 `keendata-JBK/research` 是科杰战略情报与认知共创平台，当前目标不是做普通网页，而是建设一个可持续运行的 **科杰战略情报平台 / 实时竞对雷达 / 领导每日3分钟战略简报系统**。

平台要服务四类核心用户：

1. 领导层：每天用 3 分钟掌握行业、竞对、生态伙伴和对科杰的启发。
2. 战略合作部：跟踪智谱、DeepSeek、华为昇腾、中科曙光、海光、天数智芯、清微智能等生态伙伴，推进联合方案和产品适配。
3. 售前与市场：把行业表达、竞对动作和新观点转化为客户话术、PPT 页面和方案弹药。
4. 产品团队：持续吸收外部 AI 数据基础设施、Agent、企业认知模型、可信数据空间、高质量数据集等新表达，反哺 KeenData、KeenClaw 和项目架构母版。

核心产品判断：

> 这个平台不是资料库，而是科杰的外部战略大脑。它要把外部行业信息、竞对动态、公众号文章和内部判断，持续转化为科杰自己的战略观点、产品表达、合作动作和母版候选。

---

## 2. 当前项目结构

```text
research/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── public/
│   ├── leader.html                         # 领导每日3分钟简报独立页面
│   └── generated/
│       ├── radar.json                      # 实时竞对雷达数据
│       └── leader-brief.json               # 领导每日3分钟简报数据
├── src/
│   ├── App.tsx                             # 主前端应用
│   ├── main.tsx
│   ├── styles.css
│   ├── data.ts                             # 种子数据：竞对、事件、主题、观点、启发
│   ├── types.ts                            # 核心类型定义
│   └── lib/
│       └── analyzer.ts                     # 前端本地材料解析器
├── scripts/
│   ├── radar-core.mjs                      # 竞对雷达核心解析与分析函数
│   ├── scan-radar.mjs                      # 自动扫描 watchlist 并生成 radar.json
│   ├── ingest-material.mjs                 # 手动导入链接并生成分析
│   └── generate-leader-brief.mjs           # 生成领导每日3分钟简报
├── content/
│   ├── radar/
│   │   └── watchlist.json                  # 竞对/生态伙伴监控清单
│   ├── briefs/                             # 自动竞对日报 Markdown
│   ├── leader-briefs/                      # 领导简报 Markdown
│   └── manual/                             # 手动导入材料存档
└── .github/
    └── workflows/
        ├── deploy.yml                      # GitHub Pages 部署
        ├── competitor-radar.yml            # 定时扫描竞对 + 生成领导简报
        └── ingest-material.yml             # 手动导入材料 workflow
```

---

## 3. 当前已实现功能

### 3.1 前端平台

当前前端使用 React + Vite + TypeScript，已实现：

- 首页：领导层视图、今日动态、行业热度、重点竞合对象、科杰启发。
- 竞对分析：竞合对象库、时间线、合作状态、事件影响等级。
- 行业分析：AI 数据基础设施、Agent、企业认知模型、可信数据空间、高质量数据集、国产算力生态等主题聚类。
- 观点提炼：把外部表达改写成科杰自己的战略语言。
- 对科杰启发：围绕核心定位、企业认知模型、产品架构、可信数据空间等生成启发卡。
- 母版候选池：把高价值观点沉淀为项目架构母版候选。
- 导入材料：支持粘贴文章标题、来源、链接、正文，前端即时生成结构化候选。
- 搜索：检索竞对事件、行业主题、观点和启发。

### 3.2 实时竞对雷达

已实现：

- `content/radar/watchlist.json` 配置竞合对象与信息源。
- `scripts/scan-radar.mjs` 定时扫描 RSS / 官网页面。
- `scripts/radar-core.mjs` 负责基础解析、主题识别、事件识别、影响等级、观点和科杰启发生成。
- 输出 `public/generated/radar.json`。
- 自动生成 `content/briefs/YYYY-MM-DD.md`。

### 3.3 领导每日3分钟简报

已实现：

- `scripts/generate-leader-brief.mjs` 从 radar.json 生成领导简报。
- 输出 `public/generated/leader-brief.json`。
- 输出 `content/leader-briefs/YYYY-MM-DD.md`。
- `public/leader.html` 是独立移动端页面，适合领导收藏和每日查看。

### 3.4 GitHub Actions

已实现：

- `competitor-radar.yml`：每天定时扫描竞对，并生成领导简报。
- `ingest-material.yml`：支持手动输入外部材料链接，进入竞对雷达与领导简报。
- `deploy.yml`：部署 GitHub Pages。

---

## 4. 本地开发指令

### 4.1 安装依赖

```bash
npm install
```

### 4.2 启动本地开发

```bash
npm run dev
```

本地访问：

```text
http://localhost:5173/research/
```

如 Vite 在本地不带 `/research/`，也可访问：

```text
http://localhost:5173/
```

### 4.3 构建

```bash
npm run build
```

### 4.4 预览构建结果

```bash
npm run preview
```

---

## 5. 自动化运行指令

### 5.1 本地运行竞对雷达扫描

```bash
node scripts/scan-radar.mjs
```

预期输出：

- 更新 `public/generated/radar.json`
- 生成或更新 `content/briefs/YYYY-MM-DD.md`

### 5.2 本地生成领导3分钟简报

```bash
node scripts/generate-leader-brief.mjs
```

预期输出：

- 更新 `public/generated/leader-brief.json`
- 生成或更新 `content/leader-briefs/YYYY-MM-DD.md`

### 5.3 本地手动导入一条材料

```bash
MATERIAL_TITLE="智谱发布企业智能体方案" \
MATERIAL_URL="https://example.com/article" \
MATERIAL_PUBLISHER="微信公众号" \
MATERIAL_COMPANY="智谱" \
MATERIAL_COMPANY_TYPE="模型厂商" \
node scripts/ingest-material.mjs
```

---

## 6. GitHub Actions 使用方式

### 6.1 启用 GitHub Pages

在仓库中设置：

```text
Settings → Pages → Build and deployment → GitHub Actions
```

### 6.2 手动运行实时竞对扫描

```text
Actions → Competitor Radar Scan → Run workflow
```

该 workflow 会执行：

```text
scan-radar.mjs
→ generate-leader-brief.mjs
→ commit radar.json / leader-brief.json / Markdown briefs
→ 触发 Pages 更新
```

### 6.3 手动导入外部材料

```text
Actions → Ingest Manual Material → Run workflow
```

输入字段：

- title：材料标题，必填。
- url：网页或公众号链接，选填。
- publisher：来源，例如“微信公众号”“官网”“内部材料”。
- company：涉及公司，例如“智谱”“DeepSeek”“华为昇腾”。
- company_type：公司类型，例如“模型厂商”“算力厂商”“数据基础设施”。

当前 workflow 版本不建议直接输入长正文。如需导入公众号全文，优先使用前端导入页，或后续由 Codex 增强 workflow 支持多行正文。

---

## 7. 线上访问入口

GitHub Pages 启用后，平台入口预计为：

```text
https://keendata-JBK.github.io/research/
```

领导每日3分钟简报入口：

```text
https://keendata-JBK.github.io/research/leader.html
```

---

## 8. Codex 后续维护的首要任务

### P0：保证平台可投入使用

Codex 首先要完成以下检查：

1. `npm install` 成功。
2. `npm run build` 成功。
3. `node scripts/scan-radar.mjs` 成功。
4. `node scripts/generate-leader-brief.mjs` 成功。
5. GitHub Actions 能成功运行。
6. GitHub Pages 能访问首页。
7. `leader.html` 能读取 `generated/leader-brief.json` 并正常展示。
8. 移动端样式无严重错位。

如出现 build error，优先修复 TypeScript、React JSX、import、路径和 GitHub Pages `base` 配置问题。

### P1：增强公众号材料导入

当前微信文章无法稳定自动抓取，这是正常限制。Codex 应按以下顺序增强：

1. 前端导入页支持“复制公众号全文”。
2. 支持把导入材料保存为本地 JSON 或提交到 GitHub workflow。
3. `ingest-material.yml` 支持多行正文输入，但要注意 GitHub Actions input 对长文本不友好。
4. 后续可增加 Issue Form：用户创建 issue 粘贴链接或正文，workflow 读取 issue body 进行分析。

不要第一阶段强行做微信爬虫，不要引入不稳定代理池、模拟登录、绕过反爬等方案。

### P1：增强领导简报质量

Codex 应提升 `scripts/generate-leader-brief.mjs`：

1. 去重：同一公司、同一标题、同一 URL 不重复出现。
2. 排序：优先高影响、P0 对象、今日新增。
3. 简报摘要更像领导语言：先事实，再影响，再建议。
4. 每条“建议动作”要绑定 owner：战略合作部、产品线、售前/市场、交付、经营层。
5. 增加“是否需要领导拍板”：是 / 否。
6. 增加“建议跟进人”：可先用占位字段。

### P1：优化前端入口

当前主 App 中可能未完全内嵌“3分钟简报”页面，已提供独立 `public/leader.html`。Codex 应继续：

1. 在 React App 里增加正式导航项“3分钟简报”。
2. 在首页 Hero 区增加“进入3分钟简报”按钮。
3. 把 `public/leader.html` 的页面能力迁移或复用到 React 页面中。
4. 保留 `leader.html` 独立入口，方便领导收藏。

### P2：引入 LLM API

当前 `radar-core.mjs` 是规则引擎，适合作为稳定 MVP。后续可加入 LLM：

1. 支持环境变量：`OPENAI_API_KEY`、`DEEPSEEK_API_KEY`、`ZHIPU_API_KEY`。
2. 若没有 API Key，回退规则引擎。
3. LLM 输出必须是 JSON。
4. 所有 LLM 生成内容必须保留来源、证据片段、置信度。
5. 自动生成内容必须标记为“候选”，不能直接进入正式母版。

建议设计：

```text
scripts/llm-analyzer.mjs
```

输入：source material。

输出：

```json
{
  "facts": [],
  "competitor_events": [],
  "industry_insights": [],
  "viewpoints": [],
  "kejie_implications": [],
  "risk_notes": []
}
```

### P2：完善监控对象库

维护 `content/radar/watchlist.json`，优先补充和校准：

- 模型厂商：智谱、DeepSeek、通义、文心、混元、Kimi、MiniMax、OpenAI、Anthropic、Google、Meta。
- 算力/芯片：华为昇腾、中科曙光、海光、天数智芯、清微智能、寒武纪、沐曦、摩尔线程、AMD、NVIDIA。
- 数据基础设施：Databricks、Snowflake、Palantir、Scale AI、星环科技、滴普、迅策、明略、帆软、袋鼠云、数澜。
- 区域/链主：地方数产集团、产业链主、央国企平台型公司。

注意：领导已明确，竞品不应只对比数澜、袋鼠云。平台的“竞合对象”应覆盖模型、算力、芯片、云、数据基础设施、链主和区域平台。

---

## 9. 核心数据口径

### 9.1 事件 EventItem

事件表示“某个竞合对象做了什么”。

字段：

```ts
interface EventItem {
  id: string;
  company: string;
  date: string;
  type: string;
  title: string;
  summary: string;
  source: string;
  impact: '高' | '中' | '低';
  tags: string[];
  heat: number;
}
```

### 9.2 行业主题 IndustryTheme

主题表示“行业在集中表达什么”。

字段：

```ts
interface IndustryTheme {
  id: string;
  name: string;
  summary: string;
  hot: number;
  delta: number;
  expressions: string[];
  companies: string[];
}
```

### 9.3 科杰启发 KejieImplication

启发表示“这件事对科杰意味着什么”。

字段：

```ts
interface KejieImplication {
  id: string;
  category: string;
  title: string;
  insight: string;
  action: string;
  status: '待审核' | '已发布' | '母版候选' | '已同步';
}
```

### 9.4 领导简报 LeaderBrief

建议保持以下结构：

```ts
interface LeaderBrief {
  generatedAt: string;
  title: string;
  summary: string;
  topSignals: Array<{
    company: string;
    title: string;
    date: string;
    impact: '高' | '中' | '低';
    summary: string;
    source: string;
    tags: string[];
    whyItMatters: string;
  }>;
  topThemes: Array<any>;
  kejieImplications: Array<any>;
  actions: Array<{
    owner: string;
    title: string;
    detail: string;
    priority: string;
  }>;
  keyQuestions: string[];
  riskWarnings: string[];
  sourceStats: object;
}
```

---

## 10. 内容生成原则

Codex 后续改动必须遵守：

### 原则一：先事实，后分析，再启发

每条材料必须拆成：

1. 来源事实：外部材料说了什么。
2. 初步分析：这意味着什么。
3. 对科杰启发：科杰可以怎么转化。
4. 建议动作：谁应该跟进。

### 原则二：不要直接输出公司正式结论

系统生成内容是“候选分析”，不是正式结论。必须出现：

```text
自动生成内容为候选分析，正式结论需人工审核。
```

### 原则三：竞品口径不要狭义化

不要把竞品只写成数澜、袋鼠云。必须按“竞合对象”理解：

- 模型厂商。
- 算力/芯片厂商。
- 云厂商。
- 数据基础设施厂商。
- Agent/应用厂商。
- 地方国资与产业链主。

### 原则四：科杰定位要按母版口径

平台中的科杰核心定位建议保持：

> 科杰不是狭义数据层厂商，而是面向大型组织和区域产业的 AI 数据基础设施构建者；以 AI 数据基础设施为根基，向下适配算力、芯片、模型、云和数据库，向上承接企业认知模型、KeenClaw 智能体入口与场景运营。

### 原则五：KeenClaw 的表达要克制但明确

KeenClaw 不能写成普通聊天机器人，也不能泛化成通用 Agent 平台。建议表达为：

> KeenClaw 是企业认知驱动的 Agent 控制面，是连接数据底座、企业认知模型和业务行动的组织级入口。

### 原则六：可信数据空间表达要升级

可信数据空间不能只停留在“数据流通”。建议逐步表达为：

> 可信数据空间正在从数据共享和流通机制，升级为数据、模型、工具、智能体和场景结果可信协同的基础设施。

---

## 11. 验收标准

Codex 每次修改后必须至少验证：

```bash
npm install
npm run build
node scripts/scan-radar.mjs
node scripts/generate-leader-brief.mjs
```

若改动 workflow，要检查：

```text
.github/workflows/competitor-radar.yml
.github/workflows/ingest-material.yml
.github/workflows/deploy.yml
```

若改动前端，要检查：

- PC 首页正常。
- 手机端首页正常。
- `/leader.html` 正常。
- `generated/radar.json` 加载失败时页面不崩。
- `generated/leader-brief.json` 加载失败时页面不崩。

---

## 12. 推荐下一步开发路线

### 第一步：稳定可用

1. 修复主 React App 中“3分钟简报”导航页面，确保与独立 `leader.html` 同步。
2. 运行 GitHub Actions，确认自动数据生成成功。
3. 确认 GitHub Pages 可访问。
4. 生成一次真实简报，给领导试用。

### 第二步：增强导入

1. 把 `ingest-material.yml` 升级为支持长文本或 issue form。
2. 前端导入页增加“复制结果为 Markdown”。
3. 支持一键生成“领导简报补充材料”。

### 第三步：接入 LLM

1. 新增 `scripts/llm-analyzer.mjs`。
2. 支持 OpenAI / DeepSeek / 智谱 API 三选一。
3. 输出 JSON，并保留规则引擎兜底。
4. 增加置信度和证据片段。

### 第四步：组织协同

1. 增加“战略合作部推进清单”。
2. 增加“适配状态矩阵”：已适配 / 适配中 / 已接触 / 建议接触 / 观察中。
3. 增加“母版候选审核状态”。
4. 支持导出领导周报。

---

## 13. 禁止事项

Codex 不要做以下事情：

1. 不要删除现有 workflows，除非明确替代。
2. 不要把平台改成纯博客或纯文档站。
3. 不要把所有分析写死在前端代码里，应该尽量走 JSON 数据文件。
4. 不要引入重后端，当前阶段优先保持 GitHub Pages + Actions 的轻量架构。
5. 不要强做微信公众号爬虫绕过反爬。
6. 不要把自动生成内容直接标记为“已同步母版”。
7. 不要把科杰定位写窄成“数据中台厂商”。

---

## 14. 一句话任务书

Codex 后续所有开发，都围绕一个目标：

> 把 research 仓库从一个战略情报网页，持续升级为科杰领导层每天愿意打开的“战略认知操作系统”：自动看行业、自动盯竞对、自动提炼观点、自动生成对科杰的启发，并持续反哺项目架构母版。
