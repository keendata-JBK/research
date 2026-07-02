import fs from 'node:fs/promises';
import path from 'node:path';
import { buildAnalysis, compact, extractText, extractTitle, mergeUnique } from './radar-core.mjs';

const root = process.cwd();
const outputPath = path.join(root, 'public/generated/radar.json');
const manualDir = path.join(root, 'content/manual');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fetchOptional(url) {
  if (!url) return '';
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'KeenData-Strategy-Radar/0.2' } });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

async function main() {
  const titleInput = process.env.MATERIAL_TITLE || process.argv[2] || '手动导入材料';
  const url = process.env.MATERIAL_URL || process.argv[3] || '';
  const publisher = process.env.MATERIAL_PUBLISHER || process.argv[4] || '手动导入';
  const contentInput = process.env.MATERIAL_CONTENT || process.argv.slice(5).join(' ') || '';
  const companyName = process.env.MATERIAL_COMPANY || '待识别对象';
  const companyType = process.env.MATERIAL_COMPANY_TYPE || '手动材料';

  const html = contentInput || await fetchOptional(url);
  const title = titleInput === '手动导入材料' && html ? extractTitle(html, titleInput) : titleInput;
  const content = html ? extractText(html, 2600) : title;
  const company = {
    name: companyName,
    type: companyType,
    priority: 'P0',
    keywords: [companyName, 'Agent', 'AI 数据基础设施', '大模型', '算力', '可信数据空间', '高质量数据集', '企业认知模型'],
  };

  const item = {
    title,
    url,
    publishedAt: new Date().toISOString(),
    content: compact(content, 2200),
    sourceName: publisher,
  };
  const analyzed = buildAnalysis(company, item);
  const previous = await readJson(outputPath, { events: [], themes: [], viewpoints: [], implications: [], sources: [] });
  const data = {
    generatedAt: new Date().toISOString(),
    scanSummary: `手动导入 1 条材料：${title}`,
    watchlistCount: previous.watchlistCount || 0,
    errors: previous.errors || [],
    sources: mergeUnique(previous.sources || [], [analyzed.source]).slice(0, 300),
    events: mergeUnique(previous.events || [], [analyzed.event]).slice(0, 300),
    themes: mergeUnique(previous.themes || [], [analyzed.theme]).slice(0, 80),
    viewpoints: mergeUnique(previous.viewpoints || [], [analyzed.viewpoint]).slice(0, 200),
    implications: mergeUnique(previous.implications || [], [analyzed.implication]).slice(0, 200),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.mkdir(manualDir, { recursive: true });
  await fs.writeFile(path.join(manualDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.md`), `# ${title}\n\n来源：${publisher}\n链接：${url}\n\n${content}\n`, 'utf8');
  console.log(`imported: ${title}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
