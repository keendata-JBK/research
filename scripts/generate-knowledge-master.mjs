import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const seedPath = path.join(root, 'content/master/seed-knowledge.json');
const radarPath = path.join(root, 'public/generated/radar.json');
const outputPath = path.join(root, 'public/generated/knowledge-master.json');
const snapshotsDir = path.join(root, 'content/master/snapshots');

const branchKeywords = {
  era: ['产业', '战略', '生态', '生产力'],
  contradiction: ['差距', '问题', '上下文', '权限', '评测'],
  'data-rebuild': ['数据', '高质量数据集', 'Lakehouse', '治理'],
  infrastructure: ['AI 数据基础设施', 'Data Intelligence', 'Agent-ready'],
  'three-layers': ['企业认知模型', 'Agent', '智能体', '行动'],
  'kejie-architecture': ['算力', '模型', '国产', '适配'],
  delivery: ['场景', '行业', '城市', '政府', '联合方案'],
  'final-expression': ['价值', '共生', '生态', '协同'],
};

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}

function chooseBranch(text) {
  let best = 'era';
  let score = -1;
  for (const [branchId, keywords] of Object.entries(branchKeywords)) {
    const current = keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
    if (current > score) { best = branchId; score = current; }
  }
  return best;
}

function markdown(master) {
  const sections = master.branches.map((branch) => {
    const evidence = master.evidence.filter((item) => item.branchId === branch.id).slice(0, 3)
      .map((item) => `- [${item.title}](${item.url || '#'})｜${item.publisher}`)
      .join('\n') || '- 本期暂无新增外部证据';
    return `## ${branch.order}. ${branch.title}\n\n${branch.statement}\n\n### 推导逻辑\n${branch.logic.map((item) => `- ${item}`).join('\n')}\n\n### 本期证据\n${evidence}`;
  }).join('\n\n');
  return `# ${master.title}\n\n版本：${master.version}\n更新时间：${master.generatedAt}\n\n> ${master.thesis}\n\n${sections}\n`;
}

async function main() {
  const seed = await readJson(seedPath, { title: '科杰知识母版', thesis: '', branches: [] });
  const radar = await readJson(radarPath, { sources: [], viewpoints: [], implications: [] });
  const sources = (radar.sources || []).filter((item) => item.url).slice(0, 80);
  const evidence = sources.map((source) => ({
    id: source.id,
    branchId: chooseBranch(`${source.title} ${source.summary} ${(source.tags || []).join(' ')}`),
    title: source.title,
    publisher: source.publisher,
    summary: source.summary,
    url: source.url,
    publishedAt: source.importedAt,
  }));
  const viewpointUpdates = (radar.viewpoints || []).slice(0, 10).map((item) => ({
    id: item.id,
    type: '观点候选',
    title: item.title,
    summary: item.kejieRewrite,
    source: item.source,
    sourceUrl: sources.find((source) => source.title === item.source)?.url,
  }));
  const implicationUpdates = (radar.implications || []).slice(0, 6).map((item) => ({
    id: item.id,
    type: '科杰启发',
    title: item.title,
    summary: item.action,
  }));
  const now = new Date();
  const master = {
    generatedAt: now.toISOString(),
    version: `${seed.version}.${now.toISOString().slice(0, 10).replaceAll('-', '')}`,
    title: seed.title,
    thesis: seed.thesis,
    branches: seed.branches,
    evidence,
    updates: [...viewpointUpdates, ...implicationUpdates],
    stats: {
      branches: seed.branches.length,
      evidence: evidence.length,
      updates: viewpointUpdates.length + implicationUpdates.length,
      candidateViewpoints: (radar.viewpoints || []).filter((item) => item.status === '母版候选').length,
    },
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(master, null, 2), 'utf8');
  await fs.mkdir(snapshotsDir, { recursive: true });
  await fs.writeFile(path.join(snapshotsDir, `${now.toISOString().slice(0, 10)}.md`), markdown(master), 'utf8');
  console.log(`knowledge master generated: ${master.version}, ${master.stats.evidence} evidence links`);
}

main().catch((error) => { console.error(error); process.exit(1); });
