import crypto from 'node:crypto';

export const themeRules = [
  { name: 'AI 数据基础设施', keywords: ['AI 数据基础设施', 'Data&AI', 'Lakehouse', '湖仓', '数据底座', 'Data Intelligence', 'Agent-ready'] },
  { name: 'Agent 生态', keywords: ['Agent', '智能体', '数字员工', 'CoWork', 'AutoGLM', 'Agentic'] },
  { name: '企业认知模型', keywords: ['上下文', 'Context', 'Ontology', '知识图谱', '语义', '企业认知', '业务对象'] },
  { name: '可信数据空间', keywords: ['可信数据空间', '数据空间', '数据流通', '可用不可见', '数据要素'] },
  { name: '国产算力生态', keywords: ['昇腾', '曙光', '海光', '天数智芯', '清微智能', 'GPU', 'DCU', '国产芯片', '智算'] },
  { name: '高质量数据集', keywords: ['高质量数据集', '数据集', '标注', '训练集', '评测集', '数据燃料'] }
];

export function hash(input) {
  return crypto.createHash('sha1').update(input || '').digest('hex').slice(0, 12);
}

export function compact(text = '', max = 160) {
  const normalized = String(text).replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

export function extractTitle(html, fallback = '') {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return compact(og || title || fallback, 80);
}

export function extractText(html, max = 2400) {
  return compact(html, max);
}

const navigationNoise = [
  /购买与服务热线|注册\s*\/\s*登录|检测到您已登录/, /Skip to (?:main )?content/i,
  /选择区域\/语言|返回主菜单|集团网站/, /投资者关系\s+关于我们\s+企业动态/,
  /You need to enable JavaScript to run this app/i, /首页\s+产品技术\s+产品技术/,
];

const listingTitles = [
  /^新闻中心\s*-\s*华为/i, /^新闻报道_关于我们_华为云/i, /^曙光新闻-中科曙光/i,
  /^新闻资讯-星环科技/i, /^All \| Databricks Blog/i, /^Press Releases \| Databricks/i,
  /^Inside the AI Data Cloud/i, /^Press Releases \| Snowflake/i, /^Newsroom \| Palantir/i,
  /^DeepSeek \| 深度求索/i, /^滴普科技\s*-\s*AI创造无限可能/i, /^天数智芯$/,
  /^清微智能$/i, /^海光--用“芯”计算未来/i, /^Z\.ai\s*-\s*Inspiring AGI/i, /^智谱\s*\|\s*智谱/i,
];

export function isUsableItem(item) {
  const title = compact(item?.title || '', 160);
  const content = compact(item?.content || '', 1200);
  if (!title || title.length < 8 || content.length < 35) return false;
  if (listingTitles.some((pattern) => pattern.test(title))) return false;
  if (navigationNoise.some((pattern) => pattern.test(content))) return false;
  return true;
}

export function isUsableEvent(event) {
  return isUsableItem({ title: event?.title, content: event?.summary });
}

export function parseFeed(xml, fallbackSource) {
  const items = [];
  const rssItems = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const atomItems = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const nodes = rssItems.length ? rssItems : atomItems;
  for (const node of nodes) {
    const title = node.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
      || node.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      || '未命名条目';
    const link = node.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]
      || node.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]
      || fallbackSource.url;
    const published = node.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
      || node.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
      || node.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]
      || new Date().toISOString();
    const summary = node.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1]
      || node.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]
      || node.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1]
      || title;
    items.push({ title: compact(title, 120), url: compact(link, 500), publishedAt: safeDate(published), content: compact(summary, 1200), sourceName: fallbackSource.name });
  }
  return items;
}

export function safeDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function inferImpact(text, company) {
  const high = ['战略', '合作', '发布', '融资', '上市', '政府', '国资', '算力', '模型', 'Agent', '智能体', '适配', '生态'];
  const score = high.reduce((n, key) => n + (text.includes(key) ? 1 : 0), 0) + (company?.priority === 'P0' ? 1 : 0);
  if (score >= 3) return '高';
  if (score >= 1) return '中';
  return '低';
}

export function inferTags(text, company) {
  const tags = new Set();
  for (const rule of themeRules) {
    if (rule.keywords.some((k) => text.includes(k))) tags.add(rule.name);
  }
  for (const key of company.keywords || []) {
    if (text.includes(key)) tags.add(key);
  }
  tags.add(company.type);
  return [...tags].slice(0, 6);
}

export function inferType(text) {
  if (/融资|上市|发售|估值|财报/.test(text)) return '资本动态';
  if (/合作|联合|生态|伙伴|适配/.test(text)) return '战略合作';
  if (/发布|推出|上线|升级|产品|版本/.test(text)) return '产品发布';
  if (/政府|国资|区域|城市|产业/.test(text)) return '区域产业';
  return '行业动态';
}

export function buildAnalysis(company, item) {
  const text = `${item.title}\n${item.content}`;
  const eventId = `evt_${safeDate(item.publishedAt).replaceAll('-', '')}_${hash(company.name + item.title + item.url)}`;
  const tags = inferTags(text, company);
  const impact = inferImpact(text, company);
  const type = inferType(text);
  const source = {
    id: `src_${hash(item.url || item.title)}`,
    title: item.title,
    publisher: item.sourceName || company.name,
    url: item.url,
    importedAt: new Date().toISOString().slice(0, 10),
    summary: compact(item.content || item.title, 160),
    tags,
  };
  const event = {
    id: eventId,
    company: company.name,
    date: safeDate(item.publishedAt),
    type,
    title: item.title,
    summary: compact(item.content || item.title, 150),
    source: item.sourceName || company.name,
    sourceUrl: item.url,
    impact,
    tags,
    heat: impact === '高' ? 90 : impact === '中' ? 74 : 58,
  };
  const primaryTheme = tags.find((tag) => themeRules.some((rule) => rule.name === tag)) || tags[0] || '行业观察';
  const theme = {
    id: `theme_${hash(primaryTheme + company.name)}`,
    name: primaryTheme,
    hot: impact === '高' ? 86 : impact === '中' ? 74 : 60,
    delta: impact === '高' ? 8 : 3,
    expressions: tags.slice(0, 4),
    companies: [company.name],
    summary: `${company.name} 的动态显示，“${primaryTheme}”正在与企业 AI 落地、场景运营和生态绑定加速耦合。`,
  };
  const viewpoint = {
    id: `vp_${hash(eventId + primaryTheme)}`,
    title: `${company.name} 动态中的可学习表达：${primaryTheme}`,
    source: item.title,
    rawExpression: compact(item.content || item.title, 90),
    kejieRewrite: `科杰化表达：围绕${primaryTheme}，以 AI 数据基础设施为根基，把外部能力转化为企业认知模型、KeenClaw 行动入口和场景运营闭环。`,
    scenes: ['领导汇报', '竞对分析', '售前话术', '项目架构母版'],
    status: impact === '高' ? '母版候选' : '待审核',
  };
  const implication = {
    id: `kj_${hash(eventId + company.name)}`,
    category: primaryTheme,
    title: `对科杰的启发：${company.name}｜${primaryTheme}`,
    insight: `该动态提示科杰需要把“数据—认知—行动”的能力表达持续外显，既不退回传统数据平台，也不泛化为通用 Agent。`,
    action: `建议由战略合作、产品和售前共同判断是否形成联合方案、适配清单或母版候选。`,
    status: impact === '高' ? '母版候选' : '待审核',
  };
  return { source, event, theme, viewpoint, implication };
}

export async function fetchSource(source, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(source.url, { signal: controller.signal, headers: { 'user-agent': 'KeenData-Strategy-Radar/0.2' } });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (source.kind === 'rss' || /<rss|<feed|<entry|<item/i.test(text.slice(0, 1000))) {
      return parseFeed(text, source);
    }
    return [{ title: extractTitle(text, source.name), url: source.url, publishedAt: new Date().toISOString(), content: extractText(text), sourceName: source.name }];
  } finally {
    clearTimeout(timeout);
  }
}

export function mergeUnique(existing, incoming) {
  const seen = new Set(existing.map((item) => item.id));
  return [...incoming.filter((item) => !seen.has(item.id)), ...existing];
}
