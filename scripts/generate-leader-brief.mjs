import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const radarPath = path.join(root, 'public/generated/radar.json');
const briefJsonPath = path.join(root, 'public/generated/leader-brief.json');
const briefMdDir = path.join(root, 'content/leader-briefs');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function sortEvents(events = []) {
  const weight = { '高': 3, '中': 2, '低': 1 };
  return [...events].sort((a, b) => {
    const byImpact = (weight[b.impact] || 0) - (weight[a.impact] || 0);
    if (byImpact) return byImpact;
    const byHeat = (b.heat || 0) - (a.heat || 0);
    if (byHeat) return byHeat;
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
}

function uniqueBy(items, keyFn, limit) {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
    if (result.length >= limit) break;
  }
  return result;
}

function buildBrief(radar) {
  const events = sortEvents(radar.events || []);
  const themes = [...(radar.themes || [])].sort((a, b) => (b.hot || 0) - (a.hot || 0));
  const implications = [...(radar.implications || [])].filter((item) => item.status === '母版候选' || item.status === '待审核');

  const topSignals = uniqueBy(events, (event) => `${event.company}-${event.title}`, 6).map((event) => ({
    company: event.company,
    title: event.title,
    date: event.date,
    impact: event.impact,
    summary: event.summary,
    source: event.source,
    tags: event.tags || [],
    whyItMatters: event.impact === '高'
      ? '该动态可能影响科杰的生态合作、产品定位或区域产业打法，需要纳入领导层关注。'
      : '该动态可作为行业表达、竞对口径或后续观察素材。',
  }));

  const topThemes = uniqueBy(themes, (theme) => theme.name, 5).map((theme) => ({
    name: theme.name,
    hot: theme.hot,
    delta: theme.delta,
    summary: theme.summary,
    expressions: theme.expressions || [],
    companies: theme.companies || [],
  }));

  const kejieImplications = uniqueBy(implications, (item) => item.title, 6).map((item) => ({
    category: item.category,
    title: item.title,
    insight: item.insight,
    action: item.action,
    status: item.status,
  }));

  const actions = [
    {
      owner: '战略合作部',
      title: '梳理 P0 生态伙伴推进清单',
      detail: '围绕智谱、DeepSeek、华为昇腾、中科曙光、天数智芯、海光、清微智能建立合作状态、接口适配、联合方案和标杆项目四张表。',
      priority: '高',
    },
    {
      owner: '产品线',
      title: '强化 KeenClaw 作为组织级入口与行动句柄的产品表达',
      detail: '围绕任务编排、权限治理、执行审计、效果评测、人工接管沉淀最小可演示闭环。',
      priority: '高',
    },
    {
      owner: '售前/市场',
      title: '将外部表达转化为科杰客户话术',
      detail: '把 Agent-ready、共享企业上下文、AI 数据基础设施、可信智能生产空间等表达沉淀成客户汇报页和一页纸。',
      priority: '中',
    },
  ];

  const keyQuestions = [
    '科杰对外是否统一升级为“AI 数据基础设施构建者”，而不是传统软件公司或狭义数据层厂商？',
    'KeenClaw 的核心卖点是“通用智能体平台”，还是“企业认知驱动的 Agent 控制面”？',
    '可信数据空间是否要从数据流通平台升级为“数据、模型、工具、智能体、场景结果”的可信协同空间？',
    '哪些伙伴需要进入战略合作部月度推进机制，哪些只保持观察？',
  ];

  const riskWarnings = [
    '外部官网/RSS 抓取结果只能作为事实线索，公众号全文仍建议人工导入并审核。',
    '自动生成内容是候选分析，不应直接作为公司正式战略结论。',
    '如果只追热点 Agent，容易丢失科杰的数据基础设施根基；如果只守数据底座，又容易远离业务价值出口。',
  ];

  const summary = topSignals.length
    ? `今日建议领导重点关注 ${topSignals.length} 条竞对/行业信号，其中高影响动态 ${topSignals.filter((item) => item.impact === '高').length} 条；核心议题仍集中在 AI 数据基础设施、企业认知模型、Agent 控制面和国产算力生态适配。`
    : '今日暂未形成高置信新增信号，建议继续关注 P0 伙伴与公众号材料导入。';

  return {
    generatedAt: new Date().toISOString(),
    title: '领导每日3分钟战略简报',
    summary,
    topSignals,
    topThemes,
    kejieImplications,
    actions,
    keyQuestions,
    riskWarnings,
    sourceStats: {
      events: (radar.events || []).length,
      themes: (radar.themes || []).length,
      implications: (radar.implications || []).length,
      sources: (radar.sources || []).length,
    },
  };
}

function toMarkdown(brief) {
  const signals = brief.topSignals.map((item, index) => `${index + 1}. 【${item.company}｜${item.impact}】${item.title}\n   - ${item.summary}\n   - 关注点：${item.whyItMatters}`).join('\n');
  const themes = (brief.topThemes || []).map((item, index) => `${index + 1}. ${item.name}｜热度 ${item.hot}\n   - ${item.summary}\n   - 代表厂商：${(item.companies || []).join('、')}`).join('\n');
  const implications = brief.kejieImplications.map((item, index) => `${index + 1}. ${item.title}\n   - ${item.insight}\n   - 动作：${item.action}`).join('\n');
  const actions = brief.actions.map((item, index) => `${index + 1}. 【${item.owner}｜${item.priority}】${item.title}\n   - ${item.detail}`).join('\n');
  const questions = brief.keyQuestions.map((item, index) => `${index + 1}. ${item}`).join('\n');
  const risks = brief.riskWarnings.map((item, index) => `${index + 1}. ${item}`).join('\n');
  return `# ${brief.title}\n\n生成时间：${brief.generatedAt}\n\n## 0. 3分钟摘要\n\n${brief.summary}\n\n## 1. 今日重点信号\n\n${signals || '暂无。'}\n\n## 2. 行业主题变化\n\n${themes || '暂无。'}\n\n## 3. 对科杰的启发候选\n\n${implications || '暂无。'}\n\n## 4. 建议动作\n\n${actions}\n\n## 5. 今日建议讨论问题\n\n${questions}\n\n## 6. 风险提示\n\n${risks}\n`;
}

async function main() {
  const radar = await readJson(radarPath, { events: [], themes: [], implications: [], sources: [] });
  const brief = buildBrief(radar);
  await fs.mkdir(path.dirname(briefJsonPath), { recursive: true });
  await fs.writeFile(briefJsonPath, JSON.stringify(brief, null, 2), 'utf8');
  await fs.mkdir(briefMdDir, { recursive: true });
  await fs.writeFile(path.join(briefMdDir, `${new Date().toISOString().slice(0, 10)}.md`), toMarkdown(brief), 'utf8');
  console.log(`leader brief generated: ${brief.summary}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
