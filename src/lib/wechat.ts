export type WechatArticle = {
  title: string;
  publisher: string;
  publishedAt?: string;
  content: string;
  readerUrl: string;
};

function cleanMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

export function isWechatArticleUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'mp.weixin.qq.com';
  } catch {
    return false;
  }
}

export async function readWechatArticle(url: string, signal?: AbortSignal): Promise<WechatArticle> {
  if (!isWechatArticleUrl(url)) throw new Error('请输入有效的微信公众号文章链接');
  const target = url.replace(/^https?:\/\//, '');
  const readerUrl = `https://r.jina.ai/http://${target}`;
  const response = await fetch(readerUrl, {
    signal,
    headers: { Accept: 'text/plain' },
  });
  if (!response.ok) throw new Error(`自动读取失败（${response.status}）`);
  const raw = await response.text();
  const title = raw.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || '';
  const published = raw.match(/^Published Time:\s*(.+)$/m)?.[1]?.trim();
  const body = raw.split(/Markdown Content:\s*/i)[1] || raw;
  const content = cleanMarkdown(body);
  if (!title || content.length < 120) throw new Error('文章正文未完整返回');
  const publisher = content.match(/(?:公众号|微信号)[:：]\s*([^\n]{2,30})/)?.[1]?.trim() || '微信公众号';
  return { title, publisher, publishedAt: toDate(published), content, readerUrl };
}
