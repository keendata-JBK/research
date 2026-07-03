import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bell, BookOpen, BrainCircuit, Building2, CheckCircle2, ChevronRight,
  Clipboard, Compass, ExternalLink, FileText, Filter, Flame, Home, Layers3,
  Lightbulb, Link2, Menu, Plus, Search, Settings, ShieldCheck, Sparkles,
  Target, TrendingUp, UploadCloud, X,
} from 'lucide-react';
import { analyzeMaterial } from './lib/analyzer';
import {
  competitors as seedCompetitors, events as seedEvents, implications as seedImplications,
  productMoves, sources as seedSources, themes as seedThemes, viewpoints as seedViewpoints,
} from './data';
import type {
  Competitor, EventItem, IndustryTheme, KejieImplication, SourceMaterial, Viewpoint,
} from './types';

type Page = 'home' | 'brief' | 'competitors' | 'industry' | 'viewpoints' | 'kejie' | 'master' | 'reports' | 'import' | 'search' | 'settings';
type RuntimeData = { events: EventItem[]; themes: IndustryTheme[]; viewpoints: Viewpoint[]; implications: KejieImplication[]; sources: SourceMaterial[] };
type GeneratedRadar = RuntimeData & { generatedAt?: string; scanSummary?: string; watchlistCount?: number };
type LeaderBrief = { generatedAt?: string; title?: string; summary?: string; topSignals?: Array<EventItem & { whyItMatters?: string }>; actions?: Array<{ owner: string; title: string; detail: string; priority: string }>; keyQuestions?: string[]; riskWarnings?: string[] };

const STORAGE_KEY = 'keendata-strategy-hub-runtime-v2';
const COMPETITOR_KEY = 'keendata-strategy-hub-competitors-v2';

function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

function writeStorage(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function uniqueById<T extends { id: string }>(items: T[]) { return [...new Map(items.map((item) => [item.id, item])).values()]; }
function impactClass(impact: EventItem['impact']) { return impact === '高' ? 'danger' : impact === '中' ? 'warning' : 'muted'; }

function Logo() {
  return <div className="brand"><img src={`${import.meta.env.BASE_URL}assets/keendata-logo.png`} alt="科杰科技 Keen Data" /></div>;
}

const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: '首页', icon: <Home size={18} /> },
  { key: 'brief', label: '3分钟简报', icon: <Target size={18} /> },
  { key: 'competitors', label: '竞对分析', icon: <Building2 size={18} /> },
  { key: 'industry', label: '行业分析', icon: <Compass size={18} /> },
  { key: 'viewpoints', label: '观点提炼', icon: <BrainCircuit size={18} /> },
  { key: 'kejie', label: '对科杰启发', icon: <Lightbulb size={18} /> },
  { key: 'master', label: '母版候选池', icon: <ShieldCheck size={18} /> },
  { key: 'reports', label: '报告中心', icon: <FileText size={18} /> },
  { key: 'import', label: '导入材料', icon: <UploadCloud size={18} /> },
  { key: 'search', label: '搜索', icon: <Search size={18} /> },
  { key: 'settings', label: '设置', icon: <Settings size={18} /> },
];

function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <section className="page-intro"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action}</section>;
}

function StatCard({ label, value, delta, icon }: { label: string; value: number | string; delta: string; icon: React.ReactNode }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-delta">{delta}</div></div></div>;
}

function EventRow({ item, index }: { item: EventItem; index: number }) {
  return <div className="event-row"><span className="rank">{index + 1}</span><div className="event-main"><div className="event-title">{item.title}</div><div className="event-meta"><span>{item.company}</span><span>{item.date}</span><span>{item.source}</span></div><div className="tag-line">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><span className={`impact ${impactClass(item.impact)}`}>{item.impact}</span></div>;
}

function HomePage({ events, themes, implications, viewpoints, competitors, remote, setPage }: { events: EventItem[]; themes: IndustryTheme[]; implications: KejieImplication[]; viewpoints: Viewpoint[]; competitors: Competitor[]; remote: GeneratedRadar | null; setPage: (page: Page) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const masterCount = viewpoints.filter((v) => v.status === '母版候选').length + implications.filter((v) => v.status === '母版候选').length;
  return <div className="page-grid">
    <section className="hero-card"><div><p className="eyebrow">KeenData Strategy Hub</p><h1>从外部信号到科杰产品行动</h1><p>先看事实，再识别行业共性，形成可追溯观点，最后落到产品升级、生态合作和母版候选。</p>{remote?.generatedAt && <p className="remote-line">最近扫描：{new Date(remote.generatedAt).toLocaleString()}｜监控对象：{remote.watchlistCount || competitors.length} 个</p>}</div><div className="hero-actions"><button className="primary" onClick={() => setPage('brief')}><Target size={16} />进入3分钟简报</button><button className="secondary" onClick={() => setPage('import')}><Plus size={16} />导入公众号</button></div></section>
    <div className="stats-row"><StatCard label="今日新增情报" value={events.filter((e) => e.date === today).length} delta="以真实日期统计" icon={<Sparkles size={20} />} /><StatCard label="竞合对象" value={competitors.length} delta="支持自定义扩展" icon={<Building2 size={20} />} /><StatCard label="行业主题" value={themes.length} delta="可下钻证据" icon={<Flame size={20} />} /><StatCard label="母版候选" value={masterCount} delta="待人工审核" icon={<BookOpen size={20} />} /></div>
    <div className="content-two"><section className="panel"><div className="panel-head"><div><h2>今日最重要动态</h2><p>按影响等级与热度排序</p></div><button onClick={() => setPage('competitors')}>进入竞对雷达 <ChevronRight size={14} /></button></div>{events.slice().sort((a, b) => b.heat - a.heat).slice(0, 5).map((item, index) => <EventRow key={item.id} item={item} index={index} />)}</section><section className="panel"><div className="panel-head"><div><h2>产品升级信号</h2><p>竞对迭代 → 科杰差距 → 下一版本</p></div><button onClick={() => setPage('kejie')}>查看路线图 <ChevronRight size={14} /></button></div><div className="signal-stack">{productMoves.slice(0, 4).map((move) => <article className="signal-card" key={move.id}><span className="priority-pill">{move.priority}</span><div><strong>{move.product}｜{move.direction}</strong><p>{move.nextRelease}</p></div></article>)}</div></section></div>
    <div className="content-three"><section className="panel"><div className="panel-head"><h2>行业主题上升榜</h2></div>{themes.slice().sort((a, b) => b.delta - a.delta).slice(0, 5).map((theme) => <button className="trend-row" key={theme.id} onClick={() => setPage('industry')}><span>{theme.name}</span><strong>+{theme.delta}</strong></button>)}</section><section className="panel"><div className="panel-head"><h2>重点竞合对象</h2><button onClick={() => setPage('competitors')}>管理对象</button></div>{competitors.slice(0, 6).map((c) => <div className="company-mini" key={c.id}><span className="avatar">{c.logo}</span><div><strong>{c.name}</strong><p>{c.type}｜{c.status}</p></div></div>)}</section><section className="panel"><div className="panel-head"><h2>本周领导讨论议题</h2></div><ol className="question-list"><li>哪些竞对产品升级需要进入科杰下一版本？</li><li>企业认知模型如何形成可交付的共享上下文？</li><li>可信数据空间如何承载智能体服务和结果分润？</li></ol></section></div>
  </div>;
}

function CompetitorsPage({ events, sources, competitors, onAdd, onRemove, onImport }: { events: EventItem[]; sources: SourceMaterial[]; competitors: Competitor[]; onAdd: (item: Competitor) => void; onRemove: (id: string) => void; onImport: (company: string) => void }) {
  const [active, setActive] = useState(competitors[0]?.id || '');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('全部');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: '模型厂商', status: '观察中', sourceName: '', sourceUrl: '' });
  const types = ['全部', ...new Set(competitors.map((c) => c.type))];
  const filtered = competitors.filter((c) => (type === '全部' || c.type === type) && `${c.name}${c.tags.join('')}`.toLowerCase().includes(query.toLowerCase()));
  const company = competitors.find((item) => item.id === active) || filtered[0] || competitors[0];
  const companyEvents = company ? events.filter((event) => event.company === company.name || company.tags.some((tag) => event.tags.includes(tag))).slice(0, 10) : [];
  const companySources = company ? [...(company.sources || []), ...sources.filter((s) => s.company === company.name).map((s) => ({ name: s.publisher, kind: s.publisher.includes('公众号') ? '公众号' as const : '官网' as const, url: s.url }))] : [];
  function addCompany(e: React.FormEvent) { e.preventDefault(); if (!draft.name.trim()) return; onAdd({ id: `custom_${Date.now()}`, name: draft.name.trim(), type: draft.type, logo: draft.name.trim().slice(0, 1), status: draft.status, cooperation: '待评估', summary: '自定义竞合对象，等待导入材料后补充画像。', tags: [draft.type], priority: 'P1', sources: draft.sourceName || draft.sourceUrl ? [{ name: draft.sourceName || '公众号/官网', kind: draft.sourceUrl.includes('mp.weixin') ? '公众号' : '官网', url: draft.sourceUrl || undefined }] : [] }); setDraft({ name: '', type: '模型厂商', status: '观察中', sourceName: '', sourceUrl: '' }); setShowAdd(false); }
  return <div className="page-grid"><PageIntro eyebrow="COMPETITIVE INTELLIGENCE" title="竞合对象与事件雷达" description="对象可扩展；每家公司关联公众号、官网和事件证据，并形成合作/竞争判断。" action={<button className="primary" onClick={() => setShowAdd(!showAdd)}><Plus size={16} />添加竞合对象</button>} />
    {showAdd && <form className="panel add-form" onSubmit={addCompany}><div className="panel-head"><h2>新增监控对象</h2><button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button></div><div className="form-grid"><label>公司名称<input aria-label="公司名称" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例如：Anthropic" /></label><label>对象类型<select aria-label="对象类型" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>模型厂商</option><option>云与平台型厂商</option><option>算力/芯片厂商</option><option>数据基础设施厂商</option><option>产业链主/数产集团</option></select></label><label>跟踪状态<select aria-label="跟踪状态" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>观察中</option><option>建议接触</option><option>适配中</option><option>已合作</option><option>重点竞合</option></select></label><label>公众号/来源名称<input aria-label="公众号或来源名称" value={draft.sourceName} onChange={(e) => setDraft({ ...draft, sourceName: e.target.value })} placeholder="例如：Anthropic 官方" /></label><label className="span-2">来源链接<input aria-label="来源链接" value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} placeholder="公众号文章、官网或 RSS 链接" /></label></div><button className="primary" type="submit" disabled={!draft.name.trim()}>保存并开始跟踪</button></form>}
    <div className="split-page"><section className="panel company-list"><div className="list-tools"><div className="inline-search"><Search size={16} /><input aria-label="搜索竞合对象" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索公司或标签" /></div><select aria-label="筛选对象类型" value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select></div><div className="object-count">{filtered.length} 个对象</div>{filtered.map((item) => <button className={`company-card ${company?.id === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)} key={item.id}><span className="avatar">{item.logo}</span><div><strong>{item.name}</strong><p>{item.type}｜{item.status}</p></div><ChevronRight size={16} /></button>)}</section>
      {company && <section className="panel detail-panel"><div className="company-header"><span className="big-avatar">{company.logo}</span><div><div className="title-line"><h1>{company.name}</h1><span className="priority-pill">{company.priority || 'P1'}</span></div><p>{company.summary}</p><div className="tag-line">{company.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><div className="company-actions"><button className="primary" onClick={() => onImport(company.name)}><Link2 size={16} />导入该对象公众号</button>{company.id.startsWith('custom_') && <button className="danger-button" onClick={() => onRemove(company.id)}>删除自定义对象</button>}</div></div><div className="metric-strip"><span><small>对象类型</small>{company.type}</span><span><small>合作状态</small>{company.status}</span><span><small>建议策略</small>{company.cooperation}</span></div>
        <div className="section-head"><div><h2>信息源</h2><p>公众号受反爬限制时可直接登记链接，再补正文证据。</p></div></div><div className="source-strip">{companySources.length ? companySources.map((source, i) => <div className="source-chip" key={`${source.name}-${i}`}><span>{source.kind}</span><strong>{source.name}</strong>{source.url && <a href={source.url} target="_blank" rel="noreferrer" aria-label={`打开${source.name}`}><ExternalLink size={14} /></a>}</div>) : <button className="empty-inline" onClick={() => onImport(company.name)}><Plus size={15} />添加公众号或官网来源</button>}</div>
        <div className="section-head"><div><h2>事件时间线</h2><p>展开卡片查看事实、影响和下一动作。</p></div><span>{companyEvents.length} 条关联事件</span></div><div className="timeline">{(companyEvents.length ? companyEvents : events.slice(0, 4)).map((event) => <details className="timeline-card" key={event.id}><summary><div><time>{event.date}</time><h3>{event.title}</h3><p>{event.source}｜{event.type}</p></div><span className={`impact ${impactClass(event.impact)}`}>影响 {event.impact}</span></summary><div className="evidence-grid"><div><small>来源事实</small><p>{event.summary}</p></div><div><small>初步影响</small><p>该事件与 {event.tags.slice(0, 3).join('、')} 相关，需要结合历史动作判断其产品与市场意图。</p></div><div><small>建议动作</small><p>补充原文证据，判断是否进入行业主题、观点池或产品升级看板。</p></div></div></details>)}</div>
      </section>}
    </div>
  </div>;
}

function IndustryPage({ themes, events, onCreate }: { themes: IndustryTheme[]; events: EventItem[]; onCreate: (theme: IndustryTheme) => void }) {
  const [activeId, setActiveId] = useState(themes[0]?.id || '');
  const active = themes.find((t) => t.id === activeId) || themes[0];
  const evidence = active ? events.filter((e) => e.tags.includes(active.name) || active.companies.includes(e.company)).slice(0, 6) : [];
  return <div className="page-grid"><PageIntro eyebrow="INDUSTRY THEMES" title="行业分析工作台" description="不再只是主题卡片：可查看热度变化、厂商表达、事实证据和科杰可采用角度。" />
    <div className="industry-layout"><section className="panel theme-nav"><div className="panel-head"><div><h2>主题趋势</h2><p>按热度选择并下钻</p></div><Filter size={17} /></div>{themes.slice().sort((a, b) => b.hot - a.hot).map((theme) => <button key={theme.id} className={active?.id === theme.id ? 'active' : ''} onClick={() => setActiveId(theme.id)}><div><strong>{theme.name}</strong><span>{theme.companies.slice(0, 3).join(' · ')}</span></div><div className="heat"><b>{theme.hot}</b><small>+{theme.delta}</small></div></button>)}</section>
      {active && <section className="panel theme-detail"><div className="detail-title"><div><span className="status-dot" />本周重点主题<h2>{active.name}</h2><p>{active.summary}</p></div><div className="heat-score"><strong>{active.hot}</strong><span>热度 +{active.delta}</span></div></div><div className="analysis-grid"><article><small>共同表达</small><div className="tag-line">{active.expressions.map((x) => <span className="tag" key={x}>{x}</span>)}</div></article><article><small>代表厂商</small><p>{active.companies.join('、') || '待补充'}</p></article><article className="span-2"><small>科杰可采用角度</small><p>{active.kejieAngle || `科杰应把“${active.name}”放入数据—认知—行动三层架构，明确 KeenData、企业认知模型与 KeenClaw 各自承接的能力。`}</p></article></div><div className="section-head"><div><h2>厂商表达对照</h2><p>同一主题下，不同厂商正在争夺什么位置。</p></div><button className="secondary" onClick={() => onCreate(active)}><Plus size={15} />转为观点候选</button></div><div className="comparison-table"><div className="table-head"><span>厂商</span><span>当前表达</span><span>科杰判断</span></div>{active.companies.slice(0, 6).map((company, index) => <div className="table-row" key={company}><strong>{company}</strong><span>{active.expressions[index % active.expressions.length] || active.name}</span><span>{company === '科杰' ? '形成自主母版' : index < 2 ? '重点学习产品化路径' : '持续观察'}</span></div>)}</div><div className="section-head"><div><h2>证据来源</h2><p>所有判断回到可追溯事件。</p></div><span>{evidence.length} 条</span></div><div className="evidence-list">{evidence.length ? evidence.map((item) => <article key={item.id}><div><strong>{item.company}｜{item.title}</strong><p>{item.summary}</p></div><span>{item.date}</span></article>) : <div className="empty-inline">暂无关联证据，建议先导入相关公众号或官网材料。</div>}</div></section>}
    </div>
  </div>;
}

const mapBranches = [
  ['1. 时代判断', '竞争焦点从模型能力转向产业生产力'], ['2. 核心矛盾', '模型能力不会自动变成产业价值'], ['3. 数据重构', '记录型→生产型，孤岛型→流通型，报表型→行动型'], ['4. 新基建', 'AI 数据基础设施是产业化时代的新基建'], ['5. 三层重构', '数据供给→企业认知→智能体行动'], ['6. 科杰架构', '算、数、模、行'], ['7. 落地方法', '底层逻辑统一，组织/城市/产业场景适配'], ['8. 终章表达', '科杰，与时代同频，与产业共生'],
];

function ViewpointsPage({ viewpoints, sources, onPromote }: { viewpoints: Viewpoint[]; sources: SourceMaterial[]; onPromote: (v: Viewpoint) => void }) {
  const [mode, setMode] = useState<'pool' | 'map'>('pool');
  const [activeId, setActiveId] = useState(viewpoints[0]?.id || '');
  const active = viewpoints.find((v) => v.id === activeId) || viewpoints[0];
  const related = active ? sources.filter((s) => active.sourceIds?.includes(s.id) || s.title === active.source || active.source.includes(s.publisher)).slice(0, 4) : [];
  async function copyText() { if (active) await navigator.clipboard.writeText(active.kejieRewrite); }
  return <div className="page-grid"><PageIntro eyebrow="VIEWPOINT STUDIO" title="观点提炼与数据重构地图" description="每条观点都展示来源、推导过程、科杰化表达、使用场景和母版状态。" action={<div className="segmented"><button className={mode === 'pool' ? 'active' : ''} onClick={() => setMode('pool')}>观点池</button><button className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')}>Map1 观点地图</button></div>} />
    {mode === 'map' ? <section className="panel map-panel"><div className="map-core"><span>数据重构</span><strong>AI 产业化时代的新基建</strong><p>从数据供给，到组织认知，再到智能体行动</p></div><div className="map-branches">{mapBranches.map(([title, body], index) => <button key={title} onClick={() => { const match = viewpoints.find((v) => v.mapBranch?.startsWith(String(index + 1))); if (match) { setActiveId(match.id); setMode('pool'); } }}><span>{title}</span><strong>{body}</strong><ChevronRight size={17} /></button>)}</div></section> : <div className="viewpoint-layout"><section className="panel viewpoint-list"><div className="panel-head"><div><h2>观点候选</h2><p>{viewpoints.length} 条｜点击下钻</p></div></div>{viewpoints.map((v) => <button className={active?.id === v.id ? 'active' : ''} key={v.id} onClick={() => setActiveId(v.id)}><div className="knowledge-meta">{v.mapBranch || v.source}｜{v.status}</div><strong>{v.title}</strong><p>{v.kejieRewrite}</p></button>)}</section>{active && <section className="panel viewpoint-detail"><div className="detail-title"><div><span className="status-badge">{active.status}</span><h2>{active.title}</h2><p>{active.source}</p></div><span className="confidence">置信度 {active.confidence || '中'}</span></div><div className="logic-flow"><div><span>01</span><small>外部原始表达</small><p>{active.rawExpression}</p></div>{(active.reasoning || ['识别行业变化', '判断科杰关联', '形成可用表达']).map((step, index) => <div key={step}><span>0{index + 2}</span><small>推导节点</small><p>{step}</p></div>)}<div className="result"><span>→</span><small>科杰化表达</small><p>{active.kejieRewrite}</p></div></div><div className="section-head"><div><h2>适用场景</h2><div className="tag-line">{active.scenes.map((scene) => <span className="tag" key={scene}>{scene}</span>)}</div></div></div><div className="section-head"><div><h2>来源证据</h2><p>{related.length ? '已关联原始材料' : '当前来源为 Map1/种子观点，后续可补充外部证据。'}</p></div></div>{related.map((s) => <div className="source-line" key={s.id}><div><strong>{s.title}</strong><span>{s.publisher}｜{s.importedAt}</span></div>{s.url && <a href={s.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>}</div>)}<div className="detail-actions"><button className="secondary" onClick={copyText}><Clipboard size={15} />复制表达</button><button className="primary" onClick={() => onPromote(active)}><ShieldCheck size={15} />加入母版候选</button></div></section>}</div>}
  </div>;
}

function KejiePage({ implications, onPromote }: { implications: KejieImplication[]; onPromote: (v: KejieImplication) => void }) {
  const [tab, setTab] = useState<'insights' | 'roadmap'>('roadmap');
  const categories = ['全部', ...new Set(implications.map((x) => x.category))];
  const [category, setCategory] = useState('全部');
  const filtered = implications.filter((x) => category === '全部' || x.category === category);
  return <div className="page-grid"><PageIntro eyebrow="KEENDATA ACTIONS" title="对科杰的启发与产品升级" description="启发必须落到责任人、优先级、产品差距和下一版本动作，避免停留在泛化观点。" action={<div className="segmented"><button className={tab === 'insights' ? 'active' : ''} onClick={() => setTab('insights')}>战略启发</button><button className={tab === 'roadmap' ? 'active' : ''} onClick={() => setTab('roadmap')}>产品升级路线</button></div>} />
    {tab === 'roadmap' ? <section className="panel roadmap-panel"><div className="panel-head"><div><h2>竞对迭代 → 科杰产品升级</h2><p>首版路线图，供产品月度复盘和版本立项使用。</p></div><span className="candidate-note">自动生成内容为候选分析，正式结论需人工审核</span></div><div className="roadmap-table"><div className="roadmap-head"><span>产品/方向</span><span>外部迭代信号</span><span>当前差距</span><span>下一版本动作</span><span>责任/优先级</span></div>{productMoves.map((move) => <article key={move.id}><div><strong>{move.product}</strong><span>{move.direction}</span></div><p>{move.competitorSignal}</p><p>{move.currentGap}</p><p className="next-release">{move.nextRelease}</p><div><strong>{move.owner}</strong><span className="priority-pill">{move.priority}</span></div></article>)}</div></section> : <section className="panel"><div className="filter-tabs">{categories.map((c) => <button className={category === c ? 'active' : ''} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="implication-grid">{filtered.map((item) => <article className="implication-card" key={item.id}><div className="card-top"><span>{item.category}</span><span className="priority-pill">{item.priority || '中'}</span></div><h3>{item.title}</h3><p>{item.insight}</p><div className="action-box"><small>建议动作｜{item.owner || '待指定'}</small><p>{item.action}</p></div>{item.productMoves && <ul>{item.productMoves.map((m) => <li key={m}>{m}</li>)}</ul>}<button className="secondary" onClick={() => onPromote(item)}><ShieldCheck size={15} />加入母版候选</button></article>)}</div></section>}
  </div>;
}

function ImportPage({ companyTarget, competitors, onImport }: { companyTarget: string; competitors: Competitor[]; onImport: (payload: ReturnType<typeof analyzeMaterial>) => void }) {
  const [mode, setMode] = useState<'link' | 'text'>('link');
  const [title, setTitle] = useState(''); const [publisher, setPublisher] = useState('微信公众号'); const [url, setUrl] = useState(''); const [content, setContent] = useState(''); const [company, setCompany] = useState(companyTarget || '待识别对象');
  const [result, setResult] = useState<ReturnType<typeof analyzeMaterial> | null>(null);
  useEffect(() => { if (companyTarget) setCompany(companyTarget); }, [companyTarget]);
  function submit(e: React.FormEvent) { e.preventDefault(); const analyzed = analyzeMaterial({ title, publisher, url, content, company }); setResult(analyzed); onImport(analyzed); }
  const canSubmit = mode === 'link' ? /^https?:\/\//.test(url.trim()) : content.trim().length > 20;
  return <div className="page-grid"><PageIntro eyebrow="SOURCE INGESTION" title="导入公众号与外部材料" description="可只粘贴公众号链接先登记，也可复制正文直接生成较高置信度的结构化候选。" /><div className="import-layout"><form className="panel import-panel" onSubmit={submit}><div className="segmented full"><button type="button" className={mode === 'link' ? 'active' : ''} onClick={() => setMode('link')}>公众号/网页链接</button><button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>复制正文</button></div><div className="import-guide">{mode === 'link' ? <><Link2 size={18} /><div><strong>链接可直接登记</strong><p>GitHub Pages 无法稳定跨域抓取公众号全文；系统会先保留链接和对象，标记“待补全文”，不会编造文章结论。</p></div></> : <><FileText size={18} /><div><strong>复制正文是当前最稳方式</strong><p>粘贴正文后立即生成事件、行业主题、观点和科杰启发候选。</p></div></>}</div><div className="form-grid"><label>关联对象<select aria-label="关联对象" value={company} onChange={(e) => setCompany(e.target.value)}><option>待识别对象</option>{competitors.map((c) => <option key={c.id}>{c.name}</option>)}</select></label><label>来源<input aria-label="来源" value={publisher} onChange={(e) => setPublisher(e.target.value)} /></label><label className="span-2">标题（可选）<input aria-label="标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="不填则先标记待补标题" /></label>{mode === 'link' && <label className="span-2">公众号或网页链接<input aria-label="公众号或网页链接" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mp.weixin.qq.com/s/..." /></label>}<label className="span-2">正文 / 证据片段 {mode === 'link' && '（可选）'}<textarea aria-label="正文或证据片段" value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴正文、摘要或关键段落。仅填链接也可以先登记。" /></label></div><button className="primary wide" type="submit" disabled={!canSubmit}><Sparkles size={16} />{mode === 'link' && !content.trim() ? '登记链接并建立待办' : '解析并生成候选'}</button></form><section className="panel"><div className="panel-head"><div><h2>结构化结果</h2><p>事实、分析、启发和动作分层展示</p></div></div>{result ? <div className="result-stack"><div className={`ingest-status ${result.source.status === '待补全文' ? 'warning-box' : 'success-box'}`}><CheckCircle2 size={18} /><div><strong>{result.source.status}</strong><p>{result.source.summary}</p></div></div><ResultBlock step="01" title="来源事实" body={`${result.event.company}｜${result.event.title}\n${result.event.summary}`} /><ResultBlock step="02" title="行业分析" body={`${result.theme.name}｜热度 ${result.theme.hot}\n${result.theme.summary}`} /><ResultBlock step="03" title="观点候选" body={`${result.viewpoint.kejieRewrite}\n置信度：${result.viewpoint.confidence}`} /><ResultBlock step="04" title="对科杰启发" body={`${result.implication.title}\n${result.implication.action}`} />{result.source.url && <a className="source-link" href={result.source.url} target="_blank" rel="noreferrer">打开原始链接 <ExternalLink size={15} /></a>}</div> : <div className="empty-state"><UploadCloud size={38} /><strong>等待导入</strong><p>结果会自动进入本机候选库，并保留来源状态。</p></div>}</section></div></div>;
}

function ResultBlock({ step, title, body }: { step: string; title: string; body: string }) { return <div className="result-block"><span>{step}</span><div><h3>{title}</h3><p>{body}</p></div></div>; }

function BriefPage() {
  const [brief, setBrief] = useState<LeaderBrief | null>(null); const [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}generated/leader-brief.json?ts=${Date.now()}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then(setBrief).catch(() => setFailed(true)); }, []);
  if (failed) return <section className="panel empty-state"><strong>简报加载失败</strong><p>请先运行竞对扫描与简报生成脚本。</p></section>;
  if (!brief) return <section className="panel empty-state">正在加载简报…</section>;
  return <div className="page-grid"><PageIntro eyebrow="LEADER DAILY BRIEF" title={brief.title || '领导每日3分钟战略简报'} description={brief.summary || '暂无摘要'} action={<a className="secondary link-button" href={`${import.meta.env.BASE_URL}leader.html`} target="_blank" rel="noreferrer">打开独立简报 <ExternalLink size={15} /></a>} /><div className="content-two"><section className="panel"><div className="panel-head"><h2>今日重点信号</h2><span>{brief.generatedAt ? new Date(brief.generatedAt).toLocaleString() : '待生成'}</span></div>{(brief.topSignals || []).slice(0, 6).map((item, index) => <EventRow item={item} index={index} key={item.id || `${item.company}-${index}`} />)}</section><section className="panel"><div className="panel-head"><h2>建议动作</h2></div><div className="action-list">{(brief.actions || []).map((action) => <article key={action.title}><span>{action.owner}｜{action.priority}</span><strong>{action.title}</strong><p>{action.detail}</p></article>)}</div></section></div><div className="content-two"><section className="panel"><div className="panel-head"><h2>建议讨论</h2></div><ol className="question-list">{(brief.keyQuestions || []).map((q) => <li key={q}>{q}</li>)}</ol></section><section className="panel risk-panel"><div className="panel-head"><h2>风险提示</h2></div><ol className="question-list">{(brief.riskWarnings || []).map((q) => <li key={q}>{q}</li>)}</ol></section></div></div>;
}

function MasterPage({ viewpoints, implications }: { viewpoints: Viewpoint[]; implications: KejieImplication[] }) {
  const candidates = [...viewpoints.filter((v) => v.status === '母版候选').map((v) => ({ id: v.id, type: '观点', title: v.title, body: v.kejieRewrite, source: v.source })), ...implications.filter((v) => v.status === '母版候选').map((v) => ({ id: v.id, type: v.category, title: v.title, body: v.insight, source: v.owner || '待指定' }))];
  return <div className="page-grid"><PageIntro eyebrow="MASTER CANDIDATES" title="项目架构母版候选池" description="候选内容经过待审核、已精选、已改写、母版候选后，才可人工同步到正式母版。" /><section className="panel"><div className="status-flow"><span>待审核</span><ArrowRight size={16} /><span>已精选</span><ArrowRight size={16} /><span>已改写</span><ArrowRight size={16} /><span className="active">母版候选</span><ArrowRight size={16} /><span>已同步母版</span></div><div className="candidate-grid">{candidates.map((item) => <article key={`${item.type}-${item.id}`}><span>{item.type}</span><h3>{item.title}</h3><p>{item.body}</p><small>来源/责任：{item.source}</small><button className="secondary">请求人工审核</button></article>)}</div></section></div>;
}

function SearchPage({ events, themes, implications, viewpoints }: { events: EventItem[]; themes: IndustryTheme[]; implications: KejieImplication[]; viewpoints: Viewpoint[] }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => { if (!q.trim()) return []; return [...events.map((x) => ({ type: '竞对事件', title: x.title, body: x.summary })), ...themes.map((x) => ({ type: '行业主题', title: x.name, body: x.summary })), ...implications.map((x) => ({ type: '科杰启发', title: x.title, body: x.insight })), ...viewpoints.map((x) => ({ type: '观点', title: x.title, body: x.kejieRewrite }))].filter((x) => `${x.title}${x.body}`.toLowerCase().includes(q.toLowerCase())); }, [q, events, themes, implications, viewpoints]);
  return <div className="page-grid"><PageIntro eyebrow="KNOWLEDGE SEARCH" title="全局搜索" description="跨竞对事件、行业主题、观点和科杰启发检索。" /><section className="panel"><div className="search-big"><Search size={20} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索公司、产品、观点、可信数据空间…" /></div><div className="candidate-grid">{results.map((item, i) => <article key={`${item.type}-${item.title}-${i}`}><span>{item.type}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>{q && !results.length && <div className="empty-state">没有找到匹配内容</div>}</section></div>;
}

function SimplePage({ title, children }: { title: string; children: React.ReactNode }) { return <div className="page-grid"><PageIntro title={title} description="平台运行与内容资产概览" /><section className="panel simple-body">{children}</section></div>; }

export default function App() {
  const [page, setPage] = useState<Page>('home'); const [mobileOpen, setMobileOpen] = useState(false); const [runtime, setRuntime] = useState<RuntimeData>(() => readStorage(STORAGE_KEY, { events: [], themes: [], viewpoints: [], implications: [], sources: [] })); const [customCompetitors, setCustomCompetitors] = useState<Competitor[]>(() => readStorage(COMPETITOR_KEY, [])); const [remote, setRemote] = useState<GeneratedRadar | null>(null); const [query, setQuery] = useState(''); const [importTarget, setImportTarget] = useState('');
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}generated/radar.json?ts=${Date.now()}`).then((r) => r.ok ? r.json() : null).then(setRemote).catch(() => setRemote(null)); }, []);
  const remoteData: RuntimeData = remote || { events: [], themes: [], viewpoints: [], implications: [], sources: [] };
  const events = uniqueById([...runtime.events, ...remoteData.events, ...seedEvents]); const themes = uniqueById([...runtime.themes, ...remoteData.themes, ...seedThemes]); const viewpoints = uniqueById([...runtime.viewpoints, ...remoteData.viewpoints, ...seedViewpoints]); const implications = uniqueById([...runtime.implications, ...remoteData.implications, ...seedImplications]); const sources = uniqueById([...runtime.sources, ...remoteData.sources, ...seedSources]); const competitors = uniqueById([...customCompetitors, ...seedCompetitors]);
  function saveRuntime(next: RuntimeData) { setRuntime(next); writeStorage(STORAGE_KEY, next); }
  function onImport(payload: ReturnType<typeof analyzeMaterial>) { saveRuntime({ events: [payload.event, ...runtime.events], themes: [payload.theme, ...runtime.themes], viewpoints: [payload.viewpoint, ...runtime.viewpoints], implications: [payload.implication, ...runtime.implications], sources: [payload.source, ...runtime.sources] }); }
  function addCompetitor(item: Competitor) { const next = [item, ...customCompetitors]; setCustomCompetitors(next); writeStorage(COMPETITOR_KEY, next); }
  function removeCompetitor(id: string) { const next = customCompetitors.filter((item) => item.id !== id); setCustomCompetitors(next); writeStorage(COMPETITOR_KEY, next); }
  function importFor(company: string) { setImportTarget(company); setPage('import'); }
  function createViewpoint(theme: IndustryTheme) { const item: Viewpoint = { id: `vp_theme_${Date.now()}`, title: `${theme.name}：从行业共识到科杰表达`, source: `行业主题｜${theme.name}`, rawExpression: theme.expressions.join(' / '), kejieRewrite: theme.kejieAngle || `科杰应把${theme.name}纳入“数据—认知—行动”产品架构，并明确产品承载和版本动作。`, scenes: ['领导汇报', '产品路线', '售前方案'], status: '待审核', confidence: '中', reasoning: ['聚合同主题厂商表达', '识别共同产品方向', '映射科杰三层架构'] }; saveRuntime({ ...runtime, viewpoints: [item, ...runtime.viewpoints] }); setPage('viewpoints'); }
  function promoteViewpoint(item: Viewpoint) { saveRuntime({ ...runtime, viewpoints: [{ ...item, status: '母版候选' }, ...runtime.viewpoints.filter((v) => v.id !== item.id)] }); }
  function promoteImplication(item: KejieImplication) { saveRuntime({ ...runtime, implications: [{ ...item, status: '母版候选' }, ...runtime.implications.filter((v) => v.id !== item.id)] }); }
  const pageNode = (() => { switch (page) {
    case 'home': return <HomePage events={events} themes={themes} implications={implications} viewpoints={viewpoints} competitors={competitors} remote={remote} setPage={setPage} />;
    case 'brief': return <BriefPage />;
    case 'competitors': return <CompetitorsPage events={events} sources={sources} competitors={competitors} onAdd={addCompetitor} onRemove={removeCompetitor} onImport={importFor} />;
    case 'industry': return <IndustryPage themes={themes} events={events} onCreate={createViewpoint} />;
    case 'viewpoints': return <ViewpointsPage viewpoints={viewpoints} sources={sources} onPromote={promoteViewpoint} />;
    case 'kejie': return <KejiePage implications={implications} onPromote={promoteImplication} />;
    case 'master': return <MasterPage viewpoints={viewpoints} implications={implications} />;
    case 'reports': return <SimplePage title="报告中心"><h2>内容资产</h2><p>已收录材料 {sources.length} 条、竞对事件 {events.length} 条、行业主题 {themes.length} 个、观点 {viewpoints.length} 条。</p><p>最近自动扫描：{remote?.generatedAt ? new Date(remote.generatedAt).toLocaleString() : '尚未运行'}。</p><a className="primary link-button" href={`${import.meta.env.BASE_URL}leader.html`} target="_blank" rel="noreferrer">打开领导简报</a></SimplePage>;
    case 'import': return <ImportPage companyTarget={importTarget} competitors={competitors} onImport={onImport} />;
    case 'search': return <SearchPage events={events} themes={themes} implications={implications} viewpoints={viewpoints} />;
    case 'settings': return <SimplePage title="设置"><h2>运行边界</h2><p>当前为 GitHub Pages 轻量版。公众号链接支持登记，但无法保证浏览器端自动抓取全文；推荐复制正文或使用 GitHub Actions。</p><p>自动生成内容为候选分析，正式结论需人工审核。</p></SimplePage>;
    default: return null;
  } })();
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="sidebar-top"><Logo /><button className="close-mobile" aria-label="关闭菜单" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><p className="sidebar-desc">战略情报 · 行业洞察 · 产品行动<br />让外部变化持续进入科杰版本规划</p><nav>{navItems.map((item) => <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => { setPage(item.key); setMobileOpen(false); }}>{item.icon}<span>{item.label}</span></button>)}</nav><div className="review-note"><ShieldCheck size={18} /><div><strong>候选分析机制</strong><span>AI 生成，人工审核后发布</span></div></div></aside><main className="main"><header className="topbar"><button className="mobile-menu" aria-label="打开菜单" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="top-title"><strong>{navItems.find((item) => item.key === page)?.label}</strong><span>科杰战略情报与认知共创平台</span></div><div className="top-search"><Search size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage('search'); }} placeholder="搜索竞对、行业、观点、产品…" /></div><button className="icon-btn" aria-label="通知"><Bell size={18} /></button></header>{query && page === 'search' ? <SearchPage events={events} themes={themes} implications={implications} viewpoints={viewpoints} /> : pageNode}</main></div>;
}
