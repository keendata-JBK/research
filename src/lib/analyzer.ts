import type { EventItem, IndustryTheme, KejieImplication, SourceMaterial, Viewpoint } from '../types';

const companyKeywords = ['智谱', 'DeepSeek', '华为', '昇腾', '曙光', '中科曙光', '海光', '天数智芯', '清微智能', 'Snowflake', 'Databricks', 'Palantir', '星环', '滴普', '迅策'];
const themeKeywords = ['AI 数据基础设施', 'Agent', '企业认知模型', '可信数据空间', '高质量数据集', '国产算力', 'Data&AI', '湖仓一体'];

function pickCompany(text: string) {
  return companyKeywords.find((name) => text.includes(name)) || '待识别对象';
}

function pickImpact(text: string): EventItem['impact'] {
  if (/战略|合作|融资|上市|发布|适配|政府|国资|算力|模型|Agent/.test(text)) return '高';
  if (/观点|观察|案例|报告|生态/.test(text)) return '中';
  return '低';
}

function extractTags(text: string) {
  const tags = themeKeywords.filter((keyword) => text.includes(keyword));
  return tags.length ? tags.slice(0, 5) : ['待分类'];
}

function compact(text: string, max = 120) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

function isWechatUrl(url = '') {
  return /https?:\/\/mp\.weixin\.qq\.com\//i.test(url);
}

export function analyzeMaterial(input: { title: string; publisher?: string; url?: string; content?: string; company?: string }) {
  const now = new Date().toISOString().slice(0, 10);
  const content = input.content?.trim() || '';
  const fallbackTitle = isWechatUrl(input.url) ? '微信公众号文章（待补标题）' : '外部材料链接（待补标题）';
  const title = input.title.trim() || fallbackTitle;
  const text = `${title}\n${content}\n${input.url || ''}`;
  const company = input.company?.trim() || pickCompany(text);
  const tags = extractTags(text);
  const impact = pickImpact(text);
  const source: SourceMaterial = {
    id: `src_${Date.now()}`,
    title,
    publisher: input.publisher || (isWechatUrl(input.url) ? '微信公众号' : '手动导入'),
    url: input.url,
    importedAt: now,
    summary: content ? compact(content, 160) : '链接已登记，受公众号反爬与浏览器跨域限制，待补充正文后生成高置信分析。',
    tags,
    status: content ? '已处理' : '待补全文',
    company,
    evidence: content ? compact(content, 96) : input.url,
  };

  const event: EventItem = {
    id: `evt_${Date.now()}`,
    company,
    date: now,
    type: content.includes('合作') ? '战略合作' : content.includes('发布') ? '产品发布' : content ? '行业动态' : '材料待核验',
    title,
    summary: content ? compact(content, 140) : '已登记原文链接；当前仅作为事实线索，不生成正式判断，需补充正文或通过 GitHub Actions 抓取后复核。',
    source: input.publisher || '手动导入',
    impact,
    tags,
    heat: impact === '高' ? 86 : impact === '中' ? 72 : 58,
  };

  const theme: IndustryTheme = {
    id: `theme_${Date.now()}`,
    name: tags[0] || '行业观察',
    hot: impact === '高' ? 82 : 68,
    delta: impact === '高' ? 6 : 2,
    companies: company === '待识别对象' ? [] : [company],
    expressions: tags,
    summary: `从材料看，${tags[0] || '该主题'}正在与企业 AI 落地、场景运营和产业协同发生更强关联。`,
  };

  const viewpoint: Viewpoint = {
    id: `vp_${Date.now()}`,
    title: `${company} 动态中的可学习表达`,
    source: input.title,
    rawExpression: content ? compact(content, 80) : '待补充原文证据',
    kejieRewrite: `可转化为科杰表达：以 AI 数据基础设施为根基，把外部能力转化为企业认知、KeenClaw 行动入口和场景运营闭环。`,
    scenes: ['领导汇报', '售前话术', '项目架构母版'],
    status: '待审核',
    sourceIds: [source.id],
    confidence: content ? '中' : '低',
    reasoning: ['来源事实', '行业含义', '科杰化表达', '建议动作'],
  };

  const implication: KejieImplication = {
    id: `kj_${Date.now()}`,
    category: tags.includes('可信数据空间') ? '可信数据空间' : tags.includes('企业认知模型') ? '企业认知模型' : tags.includes('Agent') ? '产品架构' : '核心定位',
    title: `对科杰的启发：${tags[0] || company}`,
    insight: `这条材料提示科杰应继续把外部趋势沉淀为“数据—认知—行动”的能力表达，避免只停留在信息收集。`,
    action: content ? '建议纳入专题跟踪，并由战略合作、产品、售前共同判断是否进入母版候选。' : '先补充公众号正文或证据片段，再进入行业观点和产品升级判断。',
    status: '待审核',
    owner: '战略合作部',
    priority: impact === '高' ? '高' : '中',
    sourceIds: [source.id],
  };

  return { source, event, theme, viewpoint, implication };
}
