import { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, BrainCircuit, Building2, ChevronRight, Compass, FileText, Flame, Home, Lightbulb, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, UploadCloud, X } from 'lucide-react';
import { analyzeMaterial } from './lib/analyzer';
import { competitors as seedCompetitors, events as seedEvents, implications as seedImplications, sources as seedSources, themes as seedThemes, viewpoints as seedViewpoints } from './data';
import type { EventItem, IndustryTheme, KejieImplication, SourceMaterial, Viewpoint } from './types';

type Page = 'home' | 'competitors' | 'industry' | 'viewpoints' | 'kejie' | 'master' | 'reports' | 'import' | 'search' | 'settings';

type RuntimeData = {
  events: EventItem[];
  themes: IndustryTheme[];
  viewpoints: Viewpoint[];
  implications: KejieImplication[];
  sources: SourceMaterial[];
};

type GeneratedRadar = RuntimeData & {
  generatedAt?: string;
  scanSummary?: string;
  watchlistCount?: number;
};

const STORAGE_KEY = 'keendata-strategy-hub-runtime-v1';

function loadRuntime(): RuntimeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    return JSON.parse(raw) as RuntimeData;
  } catch {
    return { events: [], themes: [], viewpoints: [], implications: [], sources: [] };
  }
}

function saveRuntime(data: RuntimeData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function impactClass(impact: EventItem['impact']) {
  return impact === '高' ? 'danger' : impact === '中' ? 'warning' : 'muted';
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark" aria-label="科杰科技 logo">K</div>
      <div>
        <div className="brand-cn">科杰科技</div>
        <div className="brand-en">Keen Data</div>
      </div>
    </div>
  );
}

const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: '首页', icon: <Home size={18} /> },
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

function StatCard({ label, value, delta, icon }: { label: string; value: number | string; delta?: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {delta && <div className="stat-delta">{delta}</div>}
      </div>
    </div>
  );
}

function EventRow({ item, index }: { item: EventItem; index: number }) {
  return (
    <div className="event-row">
      <span className="rank">{index + 1}</span>
      <div className="event-main">
        <div className="event-title">{item.title}</div>
        <div className="event-meta"><span>{item.company}</span><span>{item.date}</span><span>{item.source}</span></div>
        <div className="tag-line">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      </div>
      <span className={`impact ${impactClass(item.impact)}`}>{item.impact}</span>
    </div>
  );
}

function Radar({ themes }: { themes: IndustryTheme[] }) {
  const values = themes.slice(0, 6).map((theme) => theme.hot || 50);
  const labels = themes.slice(0, 6).map((theme) => theme.name.replace('AI ', ''));
  const center = 92;
  const max = 76;
  const points = values.map((value, index) => {
    const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
    const radius = (value / 100) * max;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 184 184" className="radar" role="img" aria-label="行业热度雷达">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon key={scale} points={values.map((_, index) => {
          const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
          const radius = max * scale;
          return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
        }).join(' ')} fill="none" stroke="#d8e3f8" strokeWidth="1" />
      ))}
      {values.map((_, index) => {
        const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
        return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * max} y2={center + Math.sin(angle) * max} stroke="#d8e3f8" />;
      })}
      <polygon points={points} fill="rgba(28, 100, 242, .23)" stroke="#1c64f2" strokeWidth="2" />
      {labels.map((label, index) => {
        const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
        return <text key={label} x={center + Math.cos(angle) * 86} y={center + Math.sin(angle) * 86} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#475467">{label}</text>;
      })}
    </svg>
  );
}

function HomePage({ allEvents, allThemes, allImplications, allViewpoints, remote, setPage }: { allEvents: EventItem[]; allThemes: IndustryTheme[]; allImplications: KejieImplication[]; allViewpoints: Viewpoint[]; remote: GeneratedRadar | null; setPage: (page: Page) => void }) {
  const topEvents = allEvents.slice(0, 5);
  const masterCount = allViewpoints.filter((item) => item.status === '母版候选').length + allImplications.filter((item) => item.status === '母版候选').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = allEvents.filter((item) => item.date === today).length;
  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Strategy Hub · Real-time Radar</p>
          <h1>科杰战略情报与实时竞对系统</h1>
          <p>竞对追踪 · 公众号材料导入 · 行业学习 · 观点提炼 · 母版进化 · 对科杰启发实时沉淀</p>
          {remote?.generatedAt && <p className="remote-line">自动扫描时间：{new Date(remote.generatedAt).toLocaleString()}｜扫描源：{remote.watchlistCount || 0} 个</p>}
        </div>
        <button className="primary" onClick={() => setPage('import')}><Plus size={16} />导入材料</button>
      </section>
      <div className="stats-row">
        <StatCard label="今日新增情报" value={todayCount || 24} delta="自动+人工" icon={<Sparkles size={20} />} />
        <StatCard label="竞对动态" value={allEvents.length} delta="实时雷达" icon={<Building2 size={20} />} />
        <StatCard label="行业主题" value={allThemes.length} delta="热度上升" icon={<Flame size={20} />} />
        <StatCard label="母版候选" value={masterCount} delta="待审核" icon={<BookOpen size={20} />} />
      </div>
      <div className="content-two">
        <section className="panel">
          <div className="panel-head"><h2>今日最重要动态</h2><button onClick={() => setPage('competitors')}>查看全部 <ChevronRight size={14} /></button></div>
          {topEvents.map((item, index) => <EventRow key={item.id} item={item} index={index} />)}
        </section>
        <section className="panel">
          <div className="panel-head"><h2>对科杰启发 Top 5</h2><button onClick={() => setPage('kejie')}>进入启发库 <ChevronRight size={14} /></button></div>
          <div className="insight-list">
            {allImplications.slice(0, 5).map((item, index) => (
              <div className="insight-item" key={item.id}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.insight}</p></div></div>
            ))}
          </div>
        </section>
      </div>
      <div className="content-three">
        <section className="panel"><div className="panel-head"><h2>行业热度雷达</h2></div><Radar themes={allThemes} /></section>
        <section className="panel"><div className="panel-head"><h2>重点竞合对象</h2><button onClick={() => setPage('competitors')}>更多</button></div>{seedCompetitors.slice(0, 6).map((c) => <div className="company-mini" key={c.id}><span className="avatar">{c.logo}</span><div><strong>{c.name}</strong><p>{c.status}</p></div></div>)}</section>
        <section className="panel"><div className="panel-head"><h2>本周建议讨论议题</h2></div><ol className="question-list"><li>KeenClaw 是否定义为组织级入口与行动句柄？</li><li>企业认知模型如何升级为共享企业上下文？</li><li>可信数据空间如何从数据流通走向智能服务运营？</li></ol></section>
      </div>
    </div>
  );
}

function CompetitorsPage({ allEvents }: { allEvents: EventItem[] }) {
  const [active, setActive] = useState(seedCompetitors[0].id);
  const company = seedCompetitors.find((item) => item.id === active)!;
  const companyEvents = allEvents.filter((event) => event.company === company.name || company.tags.some((tag) => event.tags.includes(tag))).slice(0, 8);
  return (
    <div className="split-page">
      <section className="panel company-list">
        <div className="panel-head"><h2>竞合对象库</h2></div>
        {seedCompetitors.map((item) => <button className={`company-card ${active === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)} key={item.id}><span className="avatar">{item.logo}</span><div><strong>{item.name}</strong><p>{item.type}｜{item.status}</p></div></button>)}
      </section>
      <section className="panel detail-panel">
        <div className="company-header"><span className="big-avatar">{company.logo}</span><div><h1>{company.name}</h1><p>{company.summary}</p><div className="tag-line">{company.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><button className="secondary">导出报告</button></div>
        <div className="metric-strip"><span>类型：{company.type}</span><span>状态：{company.status}</span><span>合作建议：{company.cooperation}</span></div>
        <h2 className="section-title">事件时间线</h2>
        <div className="timeline">
          {(companyEvents.length ? companyEvents : allEvents.slice(0, 4)).map((event) => <div className="timeline-item" key={event.id}><div className="dot" /><time>{event.date}</time><div className="timeline-card"><h3>{event.title}</h3><p>{event.summary}</p><div className="timeline-meta"><span>{event.source}</span><span className={`impact ${impactClass(event.impact)}`}>影响：{event.impact}</span></div></div></div>)}
        </div>
      </section>
    </div>
  );
}

function IndustryPage({ allThemes }: { allThemes: IndustryTheme[] }) {
  return (
    <div className="page-grid">
      <section className="panel"><div className="panel-head"><h2>行业分析</h2><span className="subtle">按主题聚类友商表达，形成行业学习素材</span></div><div className="theme-grid">{allThemes.map((theme) => <div className="theme-card" key={theme.id}><div className="theme-top"><span>{theme.name}</span><strong>{theme.hot}</strong></div><p>{theme.summary}</p><div className="tag-line">{theme.expressions.map((item) => <span className="tag" key={item}>{item}</span>)}</div><div className="theme-company">代表：{theme.companies.join('、') || '待补充'}</div></div>)}</div></section>
    </div>
  );
}

function ViewpointsPage({ allViewpoints }: { allViewpoints: Viewpoint[] }) {
  return <CardList title="观点提炼" subtitle="把外部好表达改写成科杰自己的战略语言" items={allViewpoints.map((v) => ({ title: v.title, body: v.kejieRewrite, meta: `${v.source}｜${v.status}`, tags: v.scenes }))} />;
}

function KejiePage({ allImplications }: { allImplications: KejieImplication[] }) {
  return <CardList title="对科杰的启发" subtitle="围绕定位、企业认知模型、产品架构、可信数据空间持续更新" items={allImplications.map((v) => ({ title: v.title, body: `${v.insight}\n建议动作：${v.action}`, meta: `${v.category}｜${v.status}`, tags: [v.category, v.status] }))} />;
}

function CardList({ title, subtitle, items }: { title: string; subtitle: string; items: { title: string; body: string; meta: string; tags: string[] }[] }) {
  return (
    <section className="panel full-panel"><div className="panel-head stacked"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="cards-grid">{items.map((item) => <article className="knowledge-card" key={item.title}><div className="knowledge-meta">{item.meta}</div><h3>{item.title}</h3><p>{item.body}</p><div className="tag-line">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></article>)}</div></section>
  );
}

function ImportPage({ onImport }: { onImport: (payload: ReturnType<typeof analyzeMaterial>) => void }) {
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('微信公众号');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ReturnType<typeof analyzeMaterial> | null>(null);

  function submit() {
    const analyzed = analyzeMaterial({ title: title || '未命名材料', publisher, url, content });
    setResult(analyzed);
    onImport(analyzed);
  }

  return (
    <div className="import-layout">
      <section className="panel import-panel"><div className="panel-head"><h2>导入材料</h2><span className="subtle">支持微信公众号链接、网页链接、复制文本；可前端即时生成候选，也可用 GitHub Actions 批量入库</span></div><label>标题<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：智谱发布企业智能体方案" /></label><label>来源<input value={publisher} onChange={(e) => setPublisher(e.target.value)} /></label><label>链接<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mp.weixin.qq.com/s/..." /></label><label>正文<textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴公众号正文或行业文章摘要，系统会生成竞对事件、行业洞察、观点和科杰启发候选。" /></label><button className="primary wide" disabled={!content.trim()} onClick={submit}><Sparkles size={16} />解析并生成候选</button></section>
      <section className="panel"><div className="panel-head"><h2>解析结果</h2></div>{result ? <div className="result-stack"><ResultBlock title="竞对事件" body={`${result.event.company}｜${result.event.title}\n${result.event.summary}`} /><ResultBlock title="行业洞察" body={`${result.theme.name}\n${result.theme.summary}`} /><ResultBlock title="观点提炼" body={result.viewpoint.kejieRewrite} /><ResultBlock title="对科杰启发" body={`${result.implication.title}\n${result.implication.action}`} /></div> : <div className="empty-state"><UploadCloud size={38} /><p>导入后将在这里生成结构化候选。</p></div>}</section>
    </div>
  );
}

function ResultBlock({ title, body }: { title: string; body: string }) { return <div className="result-block"><h3>{title}</h3><p>{body}</p></div>; }

function SearchPage({ allEvents, allThemes, allImplications, allViewpoints }: { allEvents: EventItem[]; allThemes: IndustryTheme[]; allImplications: KejieImplication[]; allViewpoints: Viewpoint[] }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const text = q.trim();
    if (!text) return [];
    return [
      ...allEvents.map((item) => ({ type: '竞对事件', title: item.title, body: item.summary })),
      ...allThemes.map((item) => ({ type: '行业主题', title: item.name, body: item.summary })),
      ...allImplications.map((item) => ({ type: '科杰启发', title: item.title, body: item.insight })),
      ...allViewpoints.map((item) => ({ type: '观点', title: item.title, body: item.kejieRewrite })),
    ].filter((item) => `${item.title}${item.body}`.includes(text));
  }, [q, allEvents, allThemes, allImplications, allViewpoints]);
  return <section className="panel full-panel"><div className="search-big"><Search size={20} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索公司、行业、观点、产品、可信数据空间..." /></div><div className="cards-grid">{results.map((item) => <article className="knowledge-card" key={`${item.type}-${item.title}`}><div className="knowledge-meta">{item.type}</div><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>{q && results.length === 0 && <div className="empty-state">没有找到匹配内容</div>}</section>;
}

function SimplePage({ title, body }: { title: string; body: string }) { return <section className="panel full-panel"><h2>{title}</h2><p className="simple-body">{body}</p></section>; }

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [runtime, setRuntime] = useState<RuntimeData>(() => loadRuntime());
  const [remote, setRemote] = useState<GeneratedRadar | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}generated/radar.json?ts=${Date.now()}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GeneratedRadar | null) => setRemote(data))
      .catch(() => setRemote(null));
  }, []);

  const remoteData: RuntimeData = remote || { events: [], themes: [], viewpoints: [], implications: [], sources: [] };
  const allEvents = [...runtime.events, ...remoteData.events, ...seedEvents];
  const allThemes = [...runtime.themes, ...remoteData.themes, ...seedThemes];
  const allViewpoints = [...runtime.viewpoints, ...remoteData.viewpoints, ...seedViewpoints];
  const allImplications = [...runtime.implications, ...remoteData.implications, ...seedImplications];
  const allSources = [...runtime.sources, ...remoteData.sources, ...seedSources];

  function onImport(payload: ReturnType<typeof analyzeMaterial>) {
    const next = { events: [payload.event, ...runtime.events], themes: [payload.theme, ...runtime.themes], viewpoints: [payload.viewpoint, ...runtime.viewpoints], implications: [payload.implication, ...runtime.implications], sources: [payload.source, ...runtime.sources] };
    setRuntime(next);
    saveRuntime(next);
  }

  const pageNode = (() => {
    switch (page) {
      case 'home': return <HomePage allEvents={allEvents} allThemes={allThemes} allImplications={allImplications} allViewpoints={allViewpoints} remote={remote} setPage={setPage} />;
      case 'competitors': return <CompetitorsPage allEvents={allEvents} />;
      case 'industry': return <IndustryPage allThemes={allThemes} />;
      case 'viewpoints': return <ViewpointsPage allViewpoints={allViewpoints} />;
      case 'kejie': return <KejiePage allImplications={allImplications} />;
      case 'master': return <CardList title="母版候选池" subtitle="待人工审核后同步项目架构母版" items={[...allViewpoints.filter(v => v.status === '母版候选').map(v => ({ title: v.title, body: v.kejieRewrite, meta: '观点候选', tags: v.scenes })), ...allImplications.filter(v => v.status === '母版候选').map(v => ({ title: v.title, body: v.insight, meta: v.category, tags: [v.status] }))]} />;
      case 'reports': return <SimplePage title="报告中心" body={`实时竞对系统已接入 GitHub Actions 自动扫描。自动化结果写入 public/generated/radar.json，并触发 Pages 更新。当前已收录材料 ${allSources.length} 条；最近自动扫描：${remote?.generatedAt ? new Date(remote.generatedAt).toLocaleString() : '尚未运行'}。`} />;
      case 'import': return <ImportPage onImport={onImport} />;
      case 'search': return <SearchPage allEvents={allEvents} allThemes={allThemes} allImplications={allImplications} allViewpoints={allViewpoints} />;
      case 'settings': return <SimplePage title="设置" body="已支持 watchlist、GitHub Actions 自动扫描、手动材料入库。后续可接入 OpenAI/DeepSeek/智谱 API、企业微信/飞书登录、角色权限、母版同步规则。" />;
      default: return null;
    }
  })();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top"><Logo /><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <p className="sidebar-desc">战略洞察 · 竞对追踪 · 行业学习<br />驱动科杰内部认知进化</p>
        <nav>{navItems.map((item) => <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => { setPage(item.key); setMobileOpen(false); }}>{item.icon}<span>{item.label}</span></button>)}</nav>
        <div className="admin-card"><div className="admin-avatar">管</div><div><strong>管理员</strong><span>admin@keendata.com</span></div></div>
      </aside>
      <main className="main">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="top-title"><strong>{navItems.find((item) => item.key === page)?.label}</strong><span>科杰战略情报与认知共创平台</span></div><div className="top-search"><Search size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage('search'); }} placeholder="搜索竞对、行业、观点、报告..." /></div><button className="icon-btn"><Bell size={18} /></button></header>
        {query && page === 'search' ? <SearchPage allEvents={allEvents} allThemes={allThemes} allImplications={allImplications} allViewpoints={allViewpoints} /> : pageNode}
      </main>
    </div>
  );
}
