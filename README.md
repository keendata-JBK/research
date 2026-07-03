# 科杰战略情报 Strategy Hub

面向科杰领导层、战略合作、售前、市场、产品团队的战略情报与认知共创平台。

## 第一版 MVP

- 领导层首页：今日动态、竞对雷达、行业热词、待审事项、母版候选。
- 竞对分析：公司时间线、事件卡、影响等级、合作状态。
- 行业分析：主题热度、行业观点、友商表达汇总。
- 观点提炼：外部表达转化为科杰化观点。
- 对科杰启发：定位、企业认知模型、产品架构、可信数据空间、生态绑定。
- 导入材料：支持微信公众号链接、网页链接、复制文本、文件记录的前端解析演示。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` 使用 Vite 变量名：

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

本项目不是 Next.js，不使用 `@supabase/ssr`、`next/headers` 或 middleware。数据库结构位于 `supabase/migrations/`，前端连接封装位于 `src/lib/supabase.ts`，云端读写封装位于 `src/lib/cloud.ts`。

## 构建

```bash
npm run build
npm run preview
```

## 部署

已内置 GitHub Pages workflow：`.github/workflows/deploy.yml`。

需要在仓库 Settings → Pages 中选择 GitHub Actions，并配置仓库 Variables：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

数据库密码与 `service_role` 密钥严禁写入前端、环境示例或 GitHub Pages 构建变量。
