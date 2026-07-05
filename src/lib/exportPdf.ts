import type { EventItem, IndustryTheme, KejieImplication } from '../types';

type PdfInput = {
  events: EventItem[];
  themes: IndustryTheme[];
  implications: KejieImplication[];
};

function esc(value: string | number | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function today() {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date())
    .replace(/\//g, '-');
}

export async function exportLatestPdf({ events, themes, implications }: PdfInput) {
  const { default: html2pdf } = await import('html2pdf.js');
  const sortedEvents = [...events].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const topThemes = [...themes].sort((a, b) => b.hot - a.hot).slice(0, 5);
  const topImplications = implications.slice(0, 6);
  const cutoff = sortedEvents[0]?.date || today();
  const title = '科杰 AI 数据基础设施战略与竞合格局分析报告';
  const container = document.createElement('div');
  container.className = 'pdf-export-root';
  container.innerHTML = `
    <style>
      .pdf-export-root{width:794px;background:#fff;color:#14294b;font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.72}
      .pdf-page{min-height:1123px;padding:62px 72px;box-sizing:border-box;page-break-after:always;position:relative;background:#fff}
      .pdf-cover{background:#0d2344;color:#fff;padding-top:150px;overflow:hidden}
      .pdf-cover:after{content:"";position:absolute;right:-120px;bottom:-160px;width:520px;height:520px;border:1px solid #1f8cff;border-radius:50%;box-shadow:0 0 0 70px rgba(31,140,255,.08),0 0 0 150px rgba(31,140,255,.04)}
      .pdf-kicker{font-size:15px;letter-spacing:2px;color:#87bfff}.pdf-cover h1{font-size:42px;line-height:1.28;margin:28px 0 22px;max-width:620px}.pdf-subtitle{font-size:20px;color:#c7dbf4;max-width:560px}.pdf-date{position:absolute;left:72px;right:72px;bottom:70px;display:flex;justify-content:space-between;color:#b8cce5;font-size:14px}
      .pdf-header{display:flex;justify-content:space-between;border-bottom:1px solid #cad7e8;padding-bottom:10px;color:#6b7d96;font-size:12px}.pdf-page h2{font-size:30px;line-height:1.35;margin:64px 0 20px}.pdf-page h3{font-size:21px;margin:30px 0 12px}.pdf-lead{border:1px solid #2f74ff;background:#edf4ff;padding:15px 18px;margin:20px 0 24px}.pdf-lead strong{display:block;color:#1761dd;margin-bottom:4px}.pdf-list{padding-left:22px}.pdf-list li{margin:12px 0}.pdf-row{padding:18px 0;border-bottom:1px solid #dfe7f1}.pdf-row-meta{color:#1761dd;font-size:13px;font-weight:700}.pdf-row h4{font-size:18px;margin:6px 0}.pdf-row p{margin:4px 0;color:#3f4f66}.pdf-table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}.pdf-table th{background:#2f6fff;color:#fff;text-align:left}.pdf-table th,.pdf-table td{border:1px solid #cfdbea;padding:10px;vertical-align:top}.pdf-note{padding:14px 16px;background:#f3f7fc;border-left:4px solid #2f74ff;margin:18px 0}.pdf-footer{position:absolute;left:72px;right:72px;bottom:30px;display:flex;justify-content:space-between;border-top:1px solid #d9e2ee;padding-top:8px;color:#8291a6;font-size:11px}
    </style>
    <section class="pdf-page pdf-cover">
      <div class="pdf-kicker">KEENDATA STRATEGY RESEARCH</div>
      <h1>${esc(title)}</h1>
      <div class="pdf-subtitle">从行业事实、竞合主体动态到科杰产品与战略启发</div>
      <div class="pdf-date"><span>科杰科技战略研究</span><span>研究截止 ${esc(cutoff)}</span></div>
    </section>
    <section class="pdf-page">
      <div class="pdf-header"><span>${esc(title)}</span><span>研究截止 ${esc(cutoff)}</span></div>
      <h2>董事长一分钟速读</h2>
      <div class="pdf-lead"><strong>核心判断</strong>竞合厂商正在把数据、模型与 Agent 推向业务行动入口。科杰应继续强化 AI 数据基础设施定位，以企业认知模型连接业务上下文，以 KeenClaw 承接受控行动。</div>
      <ul class="pdf-list">
        ${sortedEvents.slice(0, 5).map((item) => `<li><strong>${esc(item.company)}：</strong>${esc(item.strategicMeaning || item.summary)}</li>`).join('')}
      </ul>
      <h3>本期数据范围</h3>
      <table class="pdf-table"><tr><th>竞合动态</th><th>行业主题</th><th>科杰启发</th><th>研究截止</th></tr><tr><td>${events.length} 条</td><td>${themes.length} 个</td><td>${implications.length} 条</td><td>${esc(cutoff)}</td></tr></table>
      <div class="pdf-footer"><span>内部战略研讨资料｜非公开</span><span>01</span></div>
    </section>
    <section class="pdf-page">
      <div class="pdf-header"><span>${esc(title)}</span><span>竞合分析</span></div>
      <h2>一、竞合格局与关键主体动态</h2>
      <div class="pdf-lead"><strong>事实观察</strong>以下内容来自平台当前已收录公开材料。事实、分析判断与对科杰的建议分层呈现，重要结论应回到原文复核。</div>
      ${sortedEvents.map((item) => `<article class="pdf-row"><div class="pdf-row-meta">${esc(item.date)}｜${esc(item.company)}｜${esc(item.type)}｜影响 ${esc(item.impact)}</div><h4>${esc(item.title)}</h4><p><strong>发生了什么：</strong>${esc(item.whatHappened || item.summary)}</p><p><strong>意味着什么：</strong>${esc(item.strategicMeaning || '待继续观察')}</p></article>`).join('')}
      <div class="pdf-footer"><span>内部战略研讨资料｜非公开</span><span>02</span></div>
    </section>
    <section class="pdf-page">
      <div class="pdf-header"><span>${esc(title)}</span><span>行业发展趋势</span></div>
      <h2>二、行业发展趋势</h2>
      ${topThemes.map((theme) => `<article class="pdf-row"><div class="pdf-row-meta">热度 ${esc(theme.hot)}｜变化 +${esc(theme.delta)}｜${esc(theme.companies.join('、'))}</div><h4>${esc(theme.name)}</h4><p>${esc(theme.summary)}</p><div class="pdf-note"><strong>科杰可采用角度：</strong>${esc(theme.kejieAngle || '持续观察并补充产品与客户证据。')}</div></article>`).join('')}
      <div class="pdf-footer"><span>内部战略研讨资料｜非公开</span><span>03</span></div>
    </section>
    <section class="pdf-page">
      <div class="pdf-header"><span>${esc(title)}</span><span>对科杰的启发</span></div>
      <h2>三、对科杰的启发与产品升级建议</h2>
      ${topImplications.map((item) => `<article class="pdf-row"><div class="pdf-row-meta">${esc(item.category)}｜优先级 ${esc(item.priority || '中')}</div><h4>${esc(item.title)}</h4><p>${esc(item.insight)}</p><div class="pdf-note"><strong>建议动作：</strong>${esc(item.action)}</div></article>`).join('')}
      <h3>研究边界</h3><p>本报告由平台当前数据自动生成，仅供内部战略讨论。厂商宣传口径不自动转化为事实；涉及产品能力、客户效果、资本与市场规模的结论，应以原始来源和内部验证为准。</p>
      <div class="pdf-footer"><span>内部战略研讨资料｜非公开</span><span>04</span></div>
    </section>`;
  document.body.appendChild(container);
  try {
    const filename = `科杰AI数据基础设施战略与竞合格局分析报告_${today()}.pdf`;
    const worker = html2pdf().set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 1.25, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    }).from(container);
    const blob = await worker.outputPdf('blob') as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    document.body.dataset.lastPdfExport = filename;
    window.dispatchEvent(new CustomEvent('keendata:pdf-exported', { detail: { filename, size: blob.size } }));
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    container.remove();
  }
}
