import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Clipboard, ExternalLink, RefreshCw } from 'lucide-react';
import type { KnowledgeMaster } from '../types';

export function KnowledgeMasterPanel({ master, onOpenViewpoints }: { master: KnowledgeMaster | null; onOpenViewpoints: () => void }) {
  const [activeId, setActiveId] = useState(master?.branches[0]?.id || 'era');
  const [copied, setCopied] = useState(false);
  const active = master?.branches.find((branch) => branch.id === activeId) || master?.branches[0];
  const evidence = useMemo(() => master?.evidence.filter((item) => item.branchId === active?.id).slice(0, 8) || [], [master, active]);
  async function copyStatement() {
    if (!active) return;
    await navigator.clipboard.writeText(active.statement);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  if (!master || !active) return <section className="panel empty-state"><RefreshCw size={34} /><strong>知识母版正在生成</strong><p>运行自动扫描后将基于 Map1 和最新竞对证据生成。</p></section>;
  return <div className="knowledge-master">
    <section className="panel knowledge-overview"><div><span className="status-badge">知识母版 {master.version}</span><h2>{master.title}</h2><p>{master.thesis}</p><small>自主更新于 {new Date(master.generatedAt).toLocaleString()}</small></div><div className="knowledge-stats"><span><strong>{master.stats.branches}</strong>逻辑分支</span><span><strong>{master.stats.evidence}</strong>证据链接</span><span><strong>{master.stats.updates}</strong>本期更新</span><span><strong>{master.stats.candidateViewpoints}</strong>母版候选</span></div></section>
    <div className="knowledge-layout"><section className="panel knowledge-nav"><div className="panel-head"><div><h2>母版目录</h2><p>沿 Map1 主线逐层下钻</p></div><BookOpen size={18} /></div>{master.branches.map((branch) => <button key={branch.id} className={active.id === branch.id ? 'active' : ''} onClick={() => setActiveId(branch.id)}><span>{String(branch.order).padStart(2, '0')}</span><div><strong>{branch.title}</strong><p>{branch.statement}</p></div><ChevronRight size={16} /></button>)}</section>
      <section className="panel knowledge-detail"><div className="detail-title"><div><span className="status-dot" />核定表达<h2>{active.order}. {active.title}</h2><p>{active.statement}</p></div><button className="secondary" onClick={copyStatement}>{copied ? <CheckCircle2 size={15} /> : <Clipboard size={15} />}{copied ? '已复制' : '复制本段'}</button></div><div className="knowledge-logic"><div><small>推导逻辑</small>{active.logic.map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div><div><small>产品承接</small>{active.productMapping.map((item) => <span className="product-chip" key={item}>{item}</span>)}</div><div><small>适用场景</small><div className="tag-line">{active.scenes.map((scene) => <span className="tag" key={scene}>{scene}</span>)}</div></div></div><div className="section-head"><div><h2>本期新增证据</h2><p>每条证据可打开原始链接核验</p></div><span>{evidence.length} 条</span></div><div className="knowledge-evidence">{evidence.length ? evidence.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><div><strong>{item.title}</strong><p>{item.summary}</p><span>{item.publisher}｜{item.publishedAt || '本期'}</span></div><ExternalLink size={16} /></a>) : <div className="empty-inline">该分支本期暂无新证据，保留既有母版表达。</div>}</div><div className="detail-actions"><button className="primary" onClick={onOpenViewpoints}>进入观点提炼继续校准 <ChevronRight size={15} /></button></div></section>
    </div><section className="panel knowledge-updates"><div className="panel-head"><div><h2>本期自主更新</h2><p>自动扫描新增内容，仅作为候选，不直接覆盖核定表达</p></div><span>{master.updates.length} 条</span></div><div className="update-grid">{master.updates.slice(0, 8).map((item) => item.sourceUrl ? <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer"><span>{item.type}</span><strong>{item.title}</strong><p>{item.summary}</p><small>{item.source || '自动扫描'} <ExternalLink size={12} /></small></a> : <article key={item.id}><span>{item.type}</span><strong>{item.title}</strong><p>{item.summary}</p><small>{item.source || '自动扫描'}</small></article>)}</div></section>
  </div>;
}
