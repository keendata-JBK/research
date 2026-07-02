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

export function analyzeMaterial(input: { title: string; publisher?: string; url?: string; content: string }) {
  const now = new Date().toISOString().slice(0, 10);
  const text = `${input.title}\n${input.content}`;
  const company = pickCompany(text);
  const tags = extractTags(text);
  const impact = pickImpact(text);
  const source: SourceMaterial = {
    id: `src_${Date.now()}`,
    title: input.title || '未命名材料',
    publisher: input.publisher || '手动导入',
    url: input.url,
    importedAt: now,
    summary: compact(input.content, 160),
    tags,
  };

  const event: EventItem = {
    id: `evt_${Date.now()}`,
    company,
    date: now,
    type: input.content.includes('合作') ? '战略合作' : input.content.includes('发布') ? '产品发布' : '行业动态',
    title: input.title || `${company} 最新动态`,
    summary: compact(input.content, 140),
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
    rawExpression: compact(input.content, 80),
    kejieRewrite: `可转化为科杰表达：以 AI 数据基础设施为根基，把外部能力转化为企业认知、KeenClaw 行动入口和场景运营闭环。`,
    scenes: ['领导汇报', '售前话术', '项目架构母版'],
    status: '待审核',
  };

  const implication: KejieImplication = {
    id: `kj_${Date.now()}`,
    category: tags.includes('可信数据空间') ? '可信数据空间' : tags.includes('企业认知模型') ? '企业认知模型' : tags.includes('Agent') ? '产品架构' : '核心定位',
    title: `对科杰的启发：${tags[0] || company}`,
    insight: `这条材料提示科杰应继续把外部趋势沉淀为“数据—认知—行动”的能力表达，避免只停留在信息收集。`,
    action: `建议纳入专题跟踪，并由战略合作、产品、售前共同判断是否进入母版候选。`,
    status: '待审核',
  };

  return { source, event, theme, viewpoint, implication };
}
