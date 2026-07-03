import fs from 'node:fs/promises';
import path from 'node:path';
import { buildAnalysis, fetchSource, mergeUnique } from './radar-core.mjs';

const root = process.cwd();
const watchlistPath = path.join(root, 'content/radar/watchlist.json');
const outputPath = path.join(root, 'public/generated/radar.json');
const briefsDir = path.join(root, 'content/briefs');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function groupTheme(themes) {
  const map = new Map();
  for (const theme of themes) {
    const prev = map.get(theme.name);
    if (!prev) {
      map.set(theme.name, { ...theme });
    } else {
      prev.hot = Math.max(prev.hot, theme.hot);
      prev.delta = Math.max(prev.delta, theme.delta);
      prev.expressions = [...new Set([...(prev.expressions || []), ...(theme.expressions || [])])].slice(0, 6);
      prev.companies = [...new Set([...(prev.companies || []), ...(theme.companies || [])])].slice(0, 8);
      const summaries = [...new Set(
        [prev.summary, theme.summary]
          .filter(Boolean)
          .flatMap((summary) => summary.split(' / ')),
      )];
      prev.summary = summaries.join(' / ').slice(0, 180).trim();
    }
  }
  return [...map.values()].sort((a, b) => b.hot - a.hot);
}

function createBrief(data) {
  const date = new Date().toISOString().slice(0, 10);
  const topEvents = data.events.slice(0, 10).map((e, i) => `${i + 1}. 【${e.company}｜${e.impact}】${e.title}\n   - ${e.summary}`).join('\n');
  const topThemes = data.themes.slice(0, 8).map((t, i) => `${i + 1}. ${t.name}｜热度 ${t.hot}\n   - ${t.summary}`).join('\n');
  const implications = data.implications.slice(0, 8).map((k, i) => `${i + 1}. ${k.title}\n   - ${k.insight}\n   - 动作：${k.action}`).join('\n');
  return `# 科杰实时竞对雷达日报｜${date}\n\n生成时间：${data.generatedAt}\n扫描源数量：${data.watchlistCount}\n\n## 一、今日重点竞对动态\n\n${topEvents || '暂无新增。'}\n\n## 二、行业主题变化\n\n${topThemes || '暂无新增。'}\n\n## 三、对科杰的启发候选\n\n${implications || '暂无新增。'}\n\n## 四、建议讨论\n\n1. 哪些动态需要进入战略合作部推进清单？\n2. 哪些观点可进入项目架构母版候选？\n3. 哪些合作对象需要形成产品适配与联合方案？\n`;
}

async function main() {
  const watchlist = await readJson(watchlistPath, { companies: [], scanLimitPerSource: 5 });
  const previous = await readJson(outputPath, { events: [], themes: [], viewpoints: [], implications: [], sources: [] });
  const incoming = { events: [], themes: [], viewpoints: [], implications: [], sources: [] };
  const errors = [];

  for (const company of watchlist.companies || []) {
    for (const source of company.sources || []) {
      try {
        const items = await fetchSource(source);
        for (const item of items.slice(0, watchlist.scanLimitPerSource || 5)) {
          const analyzed = buildAnalysis(company, item);
          incoming.sources.push(analyzed.source);
          incoming.events.push(analyzed.event);
          incoming.themes.push(analyzed.theme);
          incoming.viewpoints.push(analyzed.viewpoint);
          incoming.implications.push(analyzed.implication);
        }
      } catch (error) {
        errors.push({ company: company.name, source: source.name, url: source.url, error: String(error?.message || error) });
      }
    }
  }

  const mergedSources = mergeUnique(previous.sources || [], incoming.sources).slice(0, 300);
  const mergedEvents = mergeUnique(previous.events || [], incoming.events)
    .map((event) => ({
      ...event,
      sourceUrl: event.sourceUrl || mergedSources.find((source) => source.title === event.title || source.publisher === event.source)?.url,
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 300);
  const data = {
    generatedAt: new Date().toISOString(),
    scanSummary: `扫描 ${watchlist.companies?.length || 0} 家竞合对象，新增候选 ${incoming.events.length} 条，失败 ${errors.length} 个源。`,
    watchlistCount: watchlist.companies?.length || 0,
    errors,
    sources: mergedSources,
    events: mergedEvents,
    themes: groupTheme([...(incoming.themes || []), ...(previous.themes || [])]).slice(0, 80),
    viewpoints: mergeUnique(previous.viewpoints || [], incoming.viewpoints).slice(0, 200),
    implications: mergeUnique(previous.implications || [], incoming.implications).slice(0, 200),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');

  await fs.mkdir(briefsDir, { recursive: true });
  const briefPath = path.join(briefsDir, `${new Date().toISOString().slice(0, 10)}.md`);
  await fs.writeFile(briefPath, createBrief(data), 'utf8');
  console.log(data.scanSummary);
  if (errors.length) console.warn('errors:', JSON.stringify(errors, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
