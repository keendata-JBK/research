import type { EventItem, IndustryTheme, KejieImplication, SourceMaterial, Viewpoint } from '../types';

const companyAliases: Array<[string, string]> = [
  ['华为云', '华为云'], ['华为', '华为云'], ['昇腾', '华为昇腾'],
  ['智谱', '智谱'], ['DeepSeek', 'DeepSeek'], ['深度求索', 'DeepSeek'],
  ['中科曙光', '中科曙光'], ['曙光', '中科曙光'], ['海光', '海光'],
  ['天数智芯', '天数智芯'], ['清微智能', '清微智能'],
  ['Snowflake', 'Snowflake'], ['Databricks', 'Databricks'], ['Palantir', 'Palantir'],
  ['星环科技', '星环科技'], ['星环', '星环科技'], ['滴普', '滴普科技'], ['迅策', '迅策科技'],
  ['阿里云', '阿里云'], ['腾讯云', '腾讯云'], ['百度智能云', '百度智能云'],
];

const themeKeywords = ['AI 数据基础设施', 'Agent', '企业认知模型', '可信数据空间', '高质量数据集', '国产算力', 'Data&AI', '湖仓一体'];

function normalizeText(text: string) {
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function compact(text: string, max = 120) {
  const normalized = normalizeText(text).replace(/\n/g, ' ');
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

function sentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[。！？!?；;])\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 10);
}

function pickSentence(items: string[], pattern: RegExp, fallback: string) {
  return compact(items.find((item) => pattern.test(item)) || items[0] || fallback, 180);
}

function pickCompany(text: string) {
  return companyAliases.find(([keyword]) => text.toLowerCase().includes(keyword.toLowerCase()))?.[1] || '待识别对象';
}

function pickImpact(text: string): EventItem['impact'] {
  if (/战略|签约|合作|融资|上市|发布|升级|适配|政府|国资|算力|模型|Agent|平台/.test(text)) return '高';
  if (/观点|观察|案例|报告|生态|方案/.test(text)) return '中';
  return '低';
}

function extractTags(text: string) {
  const tags = themeKeywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
  return tags.length ? tags.slice(0, 5) : ['行业动态'];
}

function eventType(text: string) {
  if (/合作|签约|联合|伙伴/.test(text)) return '战略合作';
  if (/发布|推出|上线|升级|版本/.test(text)) return '产品发布';
  if (/融资|上市|并购/.test(text)) return '资本动态';
  if (/报告|白皮书|研究/.test(text)) return '行业观点';
  return '行业动态';
}

function extractExpression(text: string, items: string[]) {
  const quote = text.match(/[“「](.{8,90}?)[”」]/)?.[1];
  if (quote) return `“${compact(quote, 120)}”`;
  return pickSentence(items, /定位|提出|强调|定义|主张|宣布|表示/, '原文未出现明确口号，建议以产品动作作为主要证据。');
}

function themeMeaning(tags: string[], company: string) {
  if (tags.includes('Agent')) return `${company}正在把数据、模型与工具调用连接到业务行动，竞争焦点由单点能力转向可持续运行的 Agent 体系。`;
  if (tags.includes('可信数据空间')) return `${company}正在把可信数据空间从数据交换扩展到数据、模型、工具和场景协同。`;
  if (tags.includes('企业认知模型')) return '行业表达正在从知识库上移到共享企业上下文，强调业务语义、规则、权限与行动反馈。';
  if (tags.includes('国产算力')) return '国产算力竞争正在从硬件交付转向适配认证、联合产品与行业生态。';
  return `${company}正在通过产品升级或生态动作争夺企业 AI 落地入口，需持续观察其产品化和客户验证。`;
}

function kejieMeaning(tags: string[]) {
  if (tags.includes('Agent')) return '科杰应强化“Agent-ready AI 数据基础设施”定位，让 KeenData 提供受治理的数据与上下文，让 KeenClaw 承接受控行动。';
  if (tags.includes('可信数据空间')) return '科杰可把可信数据空间升级为可信智能生产空间，增加模型、工具、身份、授权和执行审计能力。';
  if (tags.includes('企业认知模型')) return '企业认知模型应从知识组织升级为共享企业上下文，形成数据认知、业务认知和行动认知三层表达。';
  if (tags.includes('国产算力')) return '科杰应把国产算力适配转化为可验证的兼容矩阵、联合方案与标杆项目，而不是停留在证书层。';
  return '建议映射到科杰核心定位、产品架构和产品升级路线，并用客户场景验证是否形成可复用能力。';
}

function isWechatUrl(url = '') {
  return /https?:\/\/mp\.weixin\.qq\.com\//i.test(url);
}

export type AnalyzeMaterialInput = {
  title: string;
  publisher?: string;
  url?: string;
  content?: string;
  company?: string;
  publishedAt?: string;
};

export function analyzeMaterial(input: AnalyzeMaterialInput) {
  const now = new Date().toISOString().slice(0, 10);
  const content = normalizeText(input.content || '');
  const fallbackTitle = isWechatUrl(input.url) ? '微信公众号文章（待补标题）' : '外部材料链接（待补标题）';
  const title = input.title.trim() || fallbackTitle;
  const text = `${title}\n${content}\n${input.url || ''}`;
  const requestedCompany = input.company?.trim();
  const company = requestedCompany && requestedCompany !== '待识别对象' ? requestedCompany : pickCompany(text);
  const tags = extractTags(text);
  const impact = pickImpact(text);
  const lines = sentences(content);
  const whatHappened = content
    ? pickSentence(lines, /发布|推出|上线|升级|合作|签约|融资|成立|开放/, compact(content, 180))
    : '链接已登记，自动读取未获得正文；补充正文后才能形成高置信解读。';
  const expression = content ? extractExpression(content, lines) : '待补充原文后提取对方关键表达。';
  const strategicMeaning = themeMeaning(tags, company);
  const kejieImpact = kejieMeaning(tags);
  const date = input.publishedAt || now;
  const source: SourceMaterial = {
    id: `src_${Date.now()}`,
    title,
    publisher: input.publisher || (isWechatUrl(input.url) ? '微信公众号' : '手动导入'),
    url: input.url,
    importedAt: date,
    summary: content ? compact(content, 180) : '链接已登记，待补充正文后生成高置信分析。',
    tags,
    status: content ? '已处理' : '待补全文',
    company,
    evidence: content ? compact(content, 120) : input.url,
  };

  const event: EventItem = {
    id: `evt_${Date.now()}`,
    company,
    date,
    publishedAt: date,
    type: content ? eventType(text) : '材料待核验',
    title,
    summary: whatHappened,
    source: source.publisher,
    sourceUrl: input.url,
    impact,
    tags,
    heat: impact === '高' ? 86 : impact === '中' ? 72 : 58,
    whatHappened,
    competitorExpression: expression,
    strategicMeaning,
    kejieImpact,
    confidence: content.length > 800 ? '高' : content ? '中' : '低',
  };

  const theme: IndustryTheme = {
    id: `theme_${tags[0].replace(/\W+/g, '_')}_${Date.now()}`,
    name: tags[0] || '行业发展趋势',
    hot: impact === '高' ? 82 : 68,
    delta: impact === '高' ? 6 : 2,
    companies: company === '待识别对象' ? [] : [company],
    expressions: tags,
    summary: strategicMeaning,
    kejieAngle: kejieImpact,
    evidence: [source.id],
  };

  const viewpoint: Viewpoint = {
    id: `vp_${Date.now()}`,
    title: `${company} 动态中的可学习表达`,
    source: title,
    rawExpression: expression,
    kejieRewrite: kejieImpact,
    scenes: ['领导汇报', '售前话术', '产品路线'],
    status: '待审核',
    sourceIds: [source.id],
    confidence: event.confidence,
    reasoning: [whatHappened, strategicMeaning, kejieImpact],
  };

  const category = tags.includes('可信数据空间')
    ? '可信数据空间'
    : tags.includes('企业认知模型')
      ? '企业认知模型'
      : tags.includes('Agent')
        ? '产品与方案架构'
        : '核心定位';
  const implication: KejieImplication = {
    id: `kj_${Date.now()}`,
    category,
    title: `对科杰的启发：${tags[0] || company}`,
    insight: kejieImpact,
    action: '纳入战略研究报告候选，并由产品与战略团队验证是否进入下一版本路线。',
    status: '待审核',
    owner: '战略合作部',
    priority: impact === '高' ? '高' : '中',
    sourceIds: [source.id],
  };

  return { source, event, theme, viewpoint, implication };
}
