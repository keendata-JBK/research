import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowSquareOut,
  CaretDown,
  Check,
  DownloadSimple,
  FilePdf,
  LinkSimple,
  MagnifyingGlass,
  Plus,
  SpinnerGap,
  UploadSimple,
  UserCircle,
  X,
} from '@phosphor-icons/react';
import { analyzeMaterial } from './lib/analyzer';
import { exportLatestPdf } from './lib/exportPdf';
import { readWechatArticle } from './lib/wechat';
import {
  getCurrentUser,
  getProfile,
  loadCloudSnapshot,
  saveAnalyzedMaterial,
  saveCompetitor as saveCloudCompetitor,
  sendMagicLink,
  signOut as cloudSignOut,
  type CloudProfile,
  type CloudSnapshot,
} from './lib/cloud';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  competitors as seedCompetitors,
  events as seedEvents,
  implications as seedImplications,
  themes as seedThemes,
  sources as seedSources,
  viewpoints as seedViewpoints,
} from './data';
import type { Competitor, EventItem, IndustryTheme, KejieImplication, SourceMaterial, Viewpoint } from './types';

type Tab = 'competitors' | 'industry' | 'kejie';
type CloudStatus = '未配置' | '未登录' | '连接中' | '已连接' | '同步失败';
type RuntimeData = {
  events: EventItem[];
  themes: IndustryTheme[];
  viewpoints: Viewpoint[];
  implications: KejieImplication[];
  sources: SourceMaterial[];
};
type GeneratedRadar = RuntimeData & { generatedAt?: string };
type AnalysisPayload = ReturnType<typeof analyzeMaterial>;

const STORAGE_KEY = 'keendata-strategy-hub-runtime-v2';
const COMPETITOR_KEY = 'keendata-strategy-hub-competitors-v2';
const EMPTY_CLOUD: CloudSnapshot = { competitors: [], events: [], themes: [], viewpoints: [], implications: [], sources: [] };
const EMPTY_RUNTIME: RuntimeData = { events: [], themes: [], viewpoints: [], implications: [], sources: [] };

function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

function writeStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function sortEvents(events: EventItem[]) {
  return [...events].sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`));
}

function formatDate(value?: string) {
  if (!value) return '待确认';
  const date = new Date(`${value}T08:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
}

function dateGroup(value: string) {
  const today = new Date();
  const target = new Date(`${value}T08:00:00`);
  const day = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - target.getTime()) / 86400000);
  if (day === 0) return '今天';
  if (day === 1) return '昨天';
  return `${target.getMonth() + 1}月${target.getDate()}日`;
}

function detailFor(event: EventItem) {
  const tagText = event.tags.length ? event.tags.join('、') : '企业 AI';
  return {
    happened: event.whatHappened || event.summary,
    expression: event.competitorExpression || `围绕“${tagText}”强化产品能力、行业落地与生态协同。`,
    meaning: event.strategicMeaning || `${event.company}正在通过${event.type}争夺企业 AI 落地入口，竞争焦点由单点技术扩展到数据、模型与业务行动的协同。`,
    impact: event.kejieImpact || '科杰应继续强化 AI 数据基础设施定位，把外部变化映射到企业认知模型、产品架构与可信数据空间的升级路线。',
  };
}

function Logo() {
  return (
    <div className="brand-lockup">
      <img src={`${import.meta.env.BASE_URL}assets/keendata-logo.png`} alt="科杰科技 KeenData" />
    </div>
  );
}

function Impact({ value }: { value: EventItem['impact'] }) {
  return <span className={`impact impact-${value}`}>影响：{value}</span>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="empty"><strong>{title}</strong><p>{body}</p></div>;
}

function CompetitorView({
  events,
  competitors,
  onAddSubject,
  onToast,
}: {
  events: EventItem[];
  competitors: Competitor[];
  onAddSubject: () => void;
  onToast: (message: string) => void;
}) {
  const [company, setCompany] = useState('全部公司');
  const filtered = useMemo(() => company === '全部公司' ? sortEvents(events) : sortEvents(events).filter((item) => item.company === company), [company, events]);
  const [selectedId, setSelectedId] = useState(filtered[0]?.id || '');
  const [selectionLocked, setSelectionLocked] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  useEffect(() => {
    if (!selectionLocked || !filtered.some((item) => item.id === selectedId)) setSelectedId(filtered[0]?.id || '');
  }, [filtered, selectedId, selectionLocked]);
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0];
  const detail = selected ? detailFor(selected) : null;

  return (
    <section className={`workspace ${mobileDetail ? 'show-mobile-detail' : ''}`}>
      <div className="master-pane">
        <div className="section-heading">
          <div><h1>竞合分析</h1><p>自动解读公众号，持续更新竞合主体动态</p></div>
          <label className="select-wrap">
            <select aria-label="筛选竞合主体" value={company} onChange={(event) => { setCompany(event.target.value); setSelectionLocked(false); }}>
              <option>全部公司</option>
              {competitors.map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
            <CaretDown size={15} />
          </label>
        </div>
        <div className="list-heading"><strong>最新动态</strong><button className="text-button" onClick={onAddSubject}><Plus size={16} />新增竞合主体</button></div>
        <div className="article-list" role="list">
          {filtered.length ? filtered.map((item, index) => {
            const isActive = selected?.id === item.id;
            const previous = filtered[index - 1];
            const group = !previous || dateGroup(previous.date) !== dateGroup(item.date) ? dateGroup(item.date) : '';
            return (
              <div key={item.id}>
                {group && <div className="date-divider">{group} · {formatDate(item.date)}</div>}
                <button
                  className={`article-row ${isActive ? 'active' : ''}`}
                  onClick={() => { setSelectedId(item.id); setSelectionLocked(true); setMobileDetail(true); }}
                  aria-pressed={isActive}
                >
                  <span className="article-date">{formatDate(item.date)}</span>
                  <span className="article-copy">
                    <span className="article-meta"><strong>{item.company}</strong><span>{item.source}</span></span>
                    <b>{item.title}</b>
                    <span>{item.summary}</span>
                  </span>
                  <ArrowSquareOut size={17} weight="regular" />
                </button>
              </div>
            );
          }) : <Empty title="暂无动态" body="导入一篇公众号文章后，系统会自动归入对应主体。" />}
        </div>
      </div>
      <aside className="detail-pane">
        <button className="mobile-back" onClick={() => setMobileDetail(false)}><ArrowLeft size={18} />返回动态列表</button>
        {selected && detail ? <>
          <div className="detail-meta">{selected.date} · {selected.source} · AI 自动解读</div>
          <div className="detail-title-row"><div><span>{selected.company}</span><h2>{selected.title}</h2></div><Impact value={selected.impact} /></div>
          <div className="interpretation">
            <article><h3>发生了什么</h3><p>{detail.happened}</p></article>
            <article><h3>对方怎么表达</h3><p>{detail.expression}</p></article>
            <article><h3>这意味着什么</h3><p>{detail.meaning}</p></article>
            <article><h3>对科杰的影响</h3><p>{detail.impact}</p></article>
          </div>
          <div className="source-footer">
            <div><span>来源：{selected.source}</span><span>发布时间：{selected.date}</span><span>置信度：{selected.confidence || '中'}</span></div>
            {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">查看公众号原文 <ArrowSquareOut size={16} /></a>}
          </div>
          <button className="secondary-button include-button" onClick={() => onToast('已纳入最新 PDF；下次导出将包含这条动态。')}><FilePdf size={17} />加入最新 PDF</button>
        </> : <Empty title="请选择一条动态" body="点击左侧条目查看完整解读。" />}
      </aside>
    </section>
  );
}

function IndustryView({ themes, events }: { themes: IndustryTheme[]; events: EventItem[] }) {
  const sorted = useMemo(() => [...themes].sort((a, b) => b.hot - a.hot), [themes]);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id || '');
  const [mobileDetail, setMobileDetail] = useState(false);
  const selected = sorted.find((item) => item.id === selectedId) || sorted[0];
  const evidence = selected ? events.filter((item) => selected.companies.includes(item.company) || item.tags.includes(selected.name)).slice(0, 5) : [];
  return (
    <section className={`workspace ${mobileDetail ? 'show-mobile-detail' : ''}`}>
      <div className="master-pane">
        <div className="section-heading"><div><h1>行业发展趋势</h1><p>把多家厂商动态汇总为可持续验证的趋势判断</p></div><span className="update-chip">本周更新 {sorted.filter((item) => item.delta > 0).length} 项</span></div>
        <div className="list-heading"><strong>趋势判断</strong><span>按热度排序</span></div>
        <div className="article-list trend-list">
          {sorted.map((item) => <button key={item.id} className={`article-row ${selected?.id === item.id ? 'active' : ''}`} onClick={() => { setSelectedId(item.id); setMobileDetail(true); }}>
            <span className="trend-score">{item.hot}</span>
            <span className="article-copy"><span className="article-meta"><strong>{item.delta >= 5 ? '持续增强' : item.delta > 0 ? '本周新增' : '保持观察'}</strong><span>{item.companies.slice(0, 3).join('、') || '跨行业'}</span></span><b>{item.name}</b><span>{item.summary}</span></span>
            <CaretDown size={17} className="row-caret" />
          </button>)}
        </div>
      </div>
      <aside className="detail-pane">
        <button className="mobile-back" onClick={() => setMobileDetail(false)}><ArrowLeft size={18} />返回趋势列表</button>
        {selected ? <>
          <div className="detail-meta">行业主题 · 热度 {selected.hot} · 变化 +{selected.delta}</div>
          <div className="detail-title-row"><div><span>趋势判断</span><h2>{selected.name}</h2></div></div>
          <div className="interpretation">
            <article><h3>趋势结论</h3><p>{selected.summary}</p></article>
            <article><h3>友商共同表达</h3><p>{selected.expressions.join(' / ') || '正在持续归纳'}</p></article>
            <article><h3>代表厂商</h3><p>{selected.companies.join('、') || '跨行业综合判断'}</p></article>
            <article><h3>科杰可采用角度</h3><p>{selected.kejieAngle || '将行业变化映射到科杰数据—认知—行动三层架构，并明确产品承载与客户验证。'}</p></article>
          </div>
          <div className="evidence-block"><strong>代表证据 · {evidence.length} 条</strong>{evidence.length ? evidence.map((item) => item.sourceUrl ? <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer"><span>{item.company}｜{item.title}</span><ArrowSquareOut size={15} /></a> : <span key={item.id}>{item.company}｜{item.title}</span>) : <p>暂无已关联动态，后续导入同主题公众号材料后自动补充。</p>}</div>
        </> : <Empty title="暂无趋势" body="竞合动态积累后，系统会自动形成行业趋势。" />}
      </aside>
    </section>
  );
}

function KejieView({ implications }: { implications: KejieImplication[] }) {
  const categories = ['核心定位', '企业认知模型', '产品与方案架构', '可信数据空间', '产品升级路线', '生态与市场打法'];
  const normalized = useMemo(() => categories.map((category) => {
    const matches = implications.filter((item) => item.category === category || (category === '产品与方案架构' && item.category === '产品架构'));
    return matches.length ? matches : [{ id: `placeholder_${category}`, category, title: `${category}的持续更新`, insight: '正在等待更多竞合与行业证据，系统会在材料达到阈值后形成新启发。', action: '继续导入相关公众号和行业报告。', status: '待审核' as const, priority: '中' as const }];
  }).flat(), [implications]);
  const [selectedId, setSelectedId] = useState(normalized[0]?.id || '');
  const [mobileDetail, setMobileDetail] = useState(false);
  const selected = normalized.find((item) => item.id === selectedId) || normalized[0];
  return (
    <section className={`workspace ${mobileDetail ? 'show-mobile-detail' : ''}`}>
      <div className="master-pane">
        <div className="section-heading"><div><h1>对科杰的启发</h1><p>把外部变化转化为定位、产品与市场行动</p></div><span className="update-chip">持续自动更新</span></div>
        <div className="list-heading"><strong>六类核心启发</strong><span>{implications.length} 条判断</span></div>
        <div className="article-list implication-list">
          {normalized.map((item) => <button key={item.id} className={`article-row ${selected?.id === item.id ? 'active' : ''}`} onClick={() => { setSelectedId(item.id); setMobileDetail(true); }}>
            <span className="category-index">{String(categories.indexOf(item.category === '产品架构' ? '产品与方案架构' : item.category) + 1).padStart(2, '0')}</span>
            <span className="article-copy"><span className="article-meta"><strong>{item.category}</strong><span>优先级 {item.priority || '中'}</span></span><b>{item.title}</b><span>{item.insight}</span></span>
            <CaretDown size={17} className="row-caret" />
          </button>)}
        </div>
      </div>
      <aside className="detail-pane">
        <button className="mobile-back" onClick={() => setMobileDetail(false)}><ArrowLeft size={18} />返回启发列表</button>
        {selected ? <>
          <div className="detail-meta">{selected.category} · 优先级 {selected.priority || '中'} · AI 候选</div>
          <div className="detail-title-row"><div><span>对科杰的启发</span><h2>{selected.title}</h2></div></div>
          <div className="kejie-statement">{selected.insight}</div>
          <div className="interpretation">
            <article><h3>为什么重要</h3><p>该判断来自近期竞合动态与行业表达的共同变化，需要持续用公开证据和客户反馈校正。</p></article>
            <article><h3>建议动作</h3><p>{selected.action}</p></article>
            <article><h3>报告落点</h3><p>纳入《科杰 AI 数据基础设施战略与竞合格局分析报告》的“对科杰的启发与产品升级建议”章节。</p></article>
          </div>
          <div className="source-footer"><div><span>状态：{selected.status}</span><span>负责人：{selected.owner || '待指定'}</span></div></div>
        </> : null}
      </aside>
    </section>
  );
}

function ImportModal({ competitors, onClose, onConfirm }: { competitors: Competitor[]; onClose: () => void; onConfirm: (payload: AnalysisPayload) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('微信公众号');
  const [publishedAt, setPublishedAt] = useState('');
  const [company, setCompany] = useState('待识别对象');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'reading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<AnalysisPayload | null>(null);

  async function readLink() {
    setStatus('reading'); setMessage('正在读取公众号正文并识别主体…'); setPreview(null);
    try {
      const article = await readWechatArticle(url);
      setTitle(article.title); setPublisher(article.publisher); setPublishedAt(article.publishedAt || ''); setContent(article.content);
      const result = analyzeMaterial({ title: article.title, publisher: article.publisher, publishedAt: article.publishedAt, url, content: article.content, company });
      setCompany(result.event.company); setPreview(result); setStatus('ready'); setMessage(`已读取正文 ${article.content.length} 字，并识别为「${result.event.company}」动态。`);
    } catch (error) {
      setStatus('error'); setMessage(`${error instanceof Error ? error.message : '自动读取失败'}。请粘贴正文，系统仍可完成总结。`);
    }
  }

  function analyzeFallback() {
    if (!title.trim() || !content.trim()) { setStatus('error'); setMessage('请补充文章标题和正文。'); return; }
    const result = analyzeMaterial({ title, publisher, publishedAt: publishedAt || undefined, url, content, company });
    setCompany(result.event.company); setPreview(result); setStatus('ready'); setMessage(`已生成解读，并归入「${result.event.company}」。`);
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="modal-head"><div><span>自动解读</span><h2 id="import-title">导入公众号文章</h2></div><button aria-label="关闭" onClick={onClose}><X size={20} /></button></div>
      <label className="field"><span>公众号文章链接</span><div className="input-action"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://mp.weixin.qq.com/s/..." autoFocus /><button className="primary-button" onClick={readLink} disabled={!url.trim() || status === 'reading'}>{status === 'reading' ? <SpinnerGap className="spin" size={18} /> : <LinkSimple size={18} />}开始解读</button></div></label>
      {message && <div className={`import-status status-${status}`}>{status === 'ready' ? <Check size={18} /> : status === 'reading' ? <SpinnerGap className="spin" size={18} /> : null}<span>{message}</span></div>}
      {(status === 'error' || status === 'ready') && <div className="fallback-fields">
        <div className="form-row"><label className="field"><span>文章标题</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>竞合主体</span><input list="competitor-options" value={company} onChange={(event) => setCompany(event.target.value)} /><datalist id="competitor-options">{competitors.map((item) => <option key={item.id} value={item.name} />)}</datalist></label></div>
        <div className="form-row"><label className="field"><span>公众号</span><input value={publisher} onChange={(event) => setPublisher(event.target.value)} /></label><label className="field"><span>发布时间</span><input type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label></div>
        <label className="field"><span>正文内容</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={7} placeholder="自动读取失败时，将公众号正文粘贴到这里" /></label>
        <button className="secondary-button wide" onClick={analyzeFallback}>重新生成解读</button>
      </div>}
      {preview && <div className="import-preview"><div><span>{preview.event.company} · {preview.event.type}</span><strong>{preview.event.title}</strong><p>{preview.event.summary}</p></div><Impact value={preview.event.impact} /></div>}
      <div className="modal-actions"><button className="ghost-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => preview && onConfirm(preview)} disabled={!preview}><Check size={18} />确认加入竞合分析</button></div>
    </section>
  </div>;
}

function AddSubjectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (item: Competitor) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('数据基础设施厂商');
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal small-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><span>竞合主体</span><h2>新增关注对象</h2></div><button aria-label="关闭" onClick={onClose}><X size={20} /></button></div><label className="field"><span>公司名称</span><input value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="例如：Anthropic" /></label><label className="field"><span>对象类型</span><select value={type} onChange={(event) => setType(event.target.value)}><option>数据基础设施厂商</option><option>模型厂商</option><option>云与平台厂商</option><option>算力/芯片厂商</option><option>合作伙伴</option></select></label><div className="modal-actions"><button className="ghost-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!name.trim()} onClick={() => onConfirm({ id: `custom_${Date.now()}`, name: name.trim(), type, logo: name.trim().slice(0, 2), status: '观察中', summary: '新建竞合对象，等待导入材料后自动完善画像。', tags: [type], cooperation: '待评估', priority: 'P1' })}><Plus size={18} />保存主体</button></div></section></div>;
}

function SearchOverlay({ query, setQuery, events, themes, implications, onClose, onSelectTab }: { query: string; setQuery: (value: string) => void; events: EventItem[]; themes: IndustryTheme[]; implications: KejieImplication[]; onClose: () => void; onSelectTab: (tab: Tab) => void }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...events.map((item) => ({ tab: 'competitors' as Tab, kind: '竞合动态', title: `${item.company}｜${item.title}`, body: item.summary })),
      ...themes.map((item) => ({ tab: 'industry' as Tab, kind: '行业趋势', title: item.name, body: item.summary })),
      ...implications.map((item) => ({ tab: 'kejie' as Tab, kind: '科杰启发', title: item.title, body: item.insight })),
    ].filter((item) => `${item.title}${item.body}`.toLowerCase().includes(q)).slice(0, 10);
  }, [query, events, themes, implications]);
  return <div className="search-overlay"><div className="search-box"><MagnifyingGlass size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、趋势或科杰启发" /><button aria-label="关闭搜索" onClick={onClose}><X size={20} /></button></div><div className="search-results">{query && !results.length ? <Empty title="没有找到结果" body="尝试搜索公司名、Agent、可信数据空间等关键词。" /> : results.map((item, index) => <button key={`${item.kind}-${index}`} onClick={() => { onSelectTab(item.tab); onClose(); }}><span>{item.kind}</span><strong>{item.title}</strong><p>{item.body}</p></button>)}</div></div>;
}

function AccountPopover({ status, profile, message, onLogin, onSignOut }: { status: CloudStatus; profile: CloudProfile | null; message: string; onLogin: (email: string) => Promise<void>; onSignOut: () => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setSending(true); try { await onLogin(email); } finally { setSending(false); } }
  return <div className="account-popover"><strong>{profile?.displayName || '科杰研究用户'}</strong><span className={`cloud-state state-${status}`}>{status}</span>{status === '已连接' ? <><p>{profile?.role || '成员'} · 数据已同步至 Supabase</p><button className="secondary-button wide" onClick={onSignOut}>退出登录</button></> : <form onSubmit={submit}><p>登录后可与团队同步导入材料。</p><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="工作邮箱" required /><button className="primary-button wide" disabled={sending}>{sending ? '发送中…' : '发送登录链接'}</button></form>}{message && <small>{message}</small>}</div>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('competitors');
  const [runtime, setRuntime] = useState<RuntimeData>(() => readStorage(STORAGE_KEY, EMPTY_RUNTIME));
  const [customCompetitors, setCustomCompetitors] = useState<Competitor[]>(() => readStorage(COMPETITOR_KEY, []));
  const [remote, setRemote] = useState<GeneratedRadar | null>(null);
  const [cloud, setCloud] = useState<CloudSnapshot>(EMPTY_CLOUD);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(isSupabaseConfigured ? '连接中' : '未配置');
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);
  const [cloudMessage, setCloudMessage] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetch(`${import.meta.env.BASE_URL}generated/radar.json?ts=${Date.now()}`).then((response) => response.ok ? response.json() : null).then(setRemote).catch(() => setRemote(null)); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function hydrate() {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        if (!user) { setCloudStatus('未登录'); setCloudProfile(null); setCloud(EMPTY_CLOUD); return; }
        setCloudStatus('连接中');
        const [profile, snapshot] = await Promise.all([getProfile(user), loadCloudSnapshot()]);
        if (!active) return;
        setCloudProfile(profile); setCloud(snapshot); setCloudStatus('已连接'); setCloudMessage('');
      } catch (error) {
        if (!active) return;
        setCloudStatus('同步失败'); setCloudMessage(error instanceof Error ? error.message : '云端同步失败');
      }
    }
    void hydrate();
    const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void hydrate(), 0));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const remoteData = remote || EMPTY_RUNTIME;
  const events = uniqueById([...cloud.events, ...runtime.events, ...remoteData.events, ...seedEvents]);
  const themes = uniqueById([...cloud.themes, ...runtime.themes, ...remoteData.themes, ...seedThemes]);
  const viewpoints = uniqueById([...cloud.viewpoints, ...runtime.viewpoints, ...remoteData.viewpoints, ...seedViewpoints]);
  const implications = uniqueById([...cloud.implications, ...runtime.implications, ...remoteData.implications, ...seedImplications]);
  const sources = uniqueById([...cloud.sources, ...runtime.sources, ...remoteData.sources, ...seedSources]);
  const competitors = uniqueById([...cloud.competitors, ...customCompetitors, ...seedCompetitors]);
  const latestDate = sortEvents(events)[0]?.date || new Date().toISOString().slice(0, 10);

  function saveRuntime(updater: (current: RuntimeData) => RuntimeData) {
    setRuntime((current) => { const next = updater(current); writeStorage(STORAGE_KEY, next); return next; });
  }

  function addCompetitor(item: Competitor) {
    setCustomCompetitors((current) => { const next = [item, ...current.filter((existing) => existing.name !== item.name)]; writeStorage(COMPETITOR_KEY, next); return next; });
    if (cloudStatus === '已连接') void saveCloudCompetitor(item).catch((error) => setCloudMessage(`云端写入失败：${error.message}`));
  }

  function handleImport(payload: AnalysisPayload) {
    saveRuntime((current) => ({
      events: [payload.event, ...current.events],
      themes: [payload.theme, ...current.themes],
      viewpoints: [payload.viewpoint, ...current.viewpoints],
      implications: [payload.implication, ...current.implications],
      sources: [payload.source, ...current.sources],
    }));
    if (payload.event.company !== '待识别对象' && !competitors.some((item) => item.name === payload.event.company)) {
      addCompetitor({ id: `auto_${Date.now()}`, name: payload.event.company, type: '自动识别主体', logo: payload.event.company.slice(0, 2), status: '观察中', summary: '由公众号文章自动识别并加入竞合对象库。', tags: payload.event.tags, cooperation: '待评估', priority: 'P1' });
    }
    if (cloudStatus === '已连接') void saveAnalyzedMaterial(payload).then(() => setCloudMessage('材料已同步到 Supabase')).catch((error) => setCloudMessage(`本机已保存，云端写入失败：${error.message}`));
    setImportOpen(false); setTab('competitors'); setToast(`已解读并归入「${payload.event.company}」竞合动态。`);
  }

  async function handleExport() {
    setExporting(true);
    try { await exportLatestPdf({ events, themes, implications }); setToast('最新战略分析 PDF 已生成。'); }
    catch (error) { setToast(error instanceof Error ? `PDF 生成失败：${error.message}` : 'PDF 生成失败'); }
    finally { setExporting(false); }
  }

  async function requestLogin(email: string) {
    try { await sendMagicLink(email); setCloudMessage(`登录链接已发送至 ${email}`); }
    catch (error) { setCloudMessage(error instanceof Error ? error.message : '发送登录链接失败'); }
  }

  async function logout() {
    try { await cloudSignOut(); setCloud(EMPTY_CLOUD); setCloudProfile(null); setCloudStatus('未登录'); setAccountOpen(false); }
    catch (error) { setCloudMessage(error instanceof Error ? error.message : '退出失败'); }
  }

  return <div className="app">
    <header className="app-header">
      <Logo />
      <nav className="primary-tabs" aria-label="主要模块">
        <button className={tab === 'competitors' ? 'active' : ''} onClick={() => setTab('competitors')}>竞合分析</button>
        <button className={tab === 'industry' ? 'active' : ''} onClick={() => setTab('industry')}>行业发展趋势</button>
        <button className={tab === 'kejie' ? 'active' : ''} onClick={() => setTab('kejie')}>对科杰的启发</button>
      </nav>
      <div className="header-actions">
        <button className="secondary-button import-button" onClick={() => setImportOpen(true)}><UploadSimple size={19} /><span>导入公众号</span></button>
        <button className="primary-button export-button" onClick={handleExport} disabled={exporting}>{exporting ? <SpinnerGap className="spin" size={19} /> : <DownloadSimple size={19} />}<span>{exporting ? '生成中…' : '导出最新 PDF'}</span></button>
        <button className="icon-button" aria-label="搜索" onClick={() => setSearchOpen(true)}><MagnifyingGlass size={22} /></button>
        <button className={`avatar-button cloud-${cloudStatus}`} aria-label="账号与同步状态" onClick={() => setAccountOpen((open) => !open)}>{cloudProfile?.displayName?.slice(0, 1) || <UserCircle size={30} weight="fill" />}</button>
      </div>
      {accountOpen && <AccountPopover status={cloudStatus} profile={cloudProfile} message={cloudMessage} onLogin={requestLogin} onSignOut={logout} />}
    </header>
    <div className="report-freshness"><span>最新报告数据截止 {latestDate}</span><span>已收录 {sources.length} 篇材料 · {events.length} 条竞合动态</span></div>
    <main className="app-main">
      {tab === 'competitors' && <CompetitorView events={events} competitors={competitors} onAddSubject={() => setAddSubjectOpen(true)} onToast={setToast} />}
      {tab === 'industry' && <IndustryView themes={themes} events={events} />}
      {tab === 'kejie' && <KejieView implications={implications} />}
    </main>
    {importOpen && <ImportModal competitors={competitors} onClose={() => setImportOpen(false)} onConfirm={handleImport} />}
    {addSubjectOpen && <AddSubjectModal onClose={() => setAddSubjectOpen(false)} onConfirm={(item) => { addCompetitor(item); setAddSubjectOpen(false); setToast(`已新增竞合主体「${item.name}」。`); }} />}
    {searchOpen && <SearchOverlay query={query} setQuery={setQuery} events={events} themes={themes} implications={implications} onClose={() => { setSearchOpen(false); setQuery(''); }} onSelectTab={setTab} />}
    {toast && <div className="toast"><Check size={18} weight="bold" />{toast}</div>}
  </div>;
}
