import { describe, expect, it } from 'vitest';
import { analyzeMaterial } from './analyzer';
import { isWechatArticleUrl } from './wechat';

describe('公众号材料分析', () => {
  it('识别主体并生成四段解读', () => {
    const result = analyzeMaterial({
      title: '华为云发布 Agentic AI 数据平台',
      publisher: '华为云公众号',
      url: 'https://mp.weixin.qq.com/s/example',
      publishedAt: '2026-07-05',
      content: '华为云正式发布新一代 Agentic AI 数据平台，围绕数据供给、企业上下文、模型服务和智能体行动进行升级。平台强调让每个企业更高效地构建和运行智能体，并支持权限治理、工具调用与执行审计。',
    });

    expect(result.event.company).toBe('华为云');
    expect(result.event.type).toBe('产品发布');
    expect(result.event.date).toBe('2026-07-05');
    expect(result.event.whatHappened).toContain('正式发布');
    expect(result.event.competitorExpression).toBeTruthy();
    expect(result.event.strategicMeaning).toContain('Agent');
    expect(result.event.kejieImpact).toContain('科杰');
    expect(result.event.confidence).toBe('中');
  });

  it('可信数据空间材料进入对应启发类别', () => {
    const result = analyzeMaterial({
      title: '可信数据空间从数据流通走向智能协同',
      company: '数产集团',
      content: '该平台发布可信数据空间升级方案，强调数据、模型、工具与智能体在统一授权和审计体系下协作，并形成可持续运营的行业场景。',
    });

    expect(result.implication.category).toBe('可信数据空间');
    expect(result.theme.name).toBe('可信数据空间');
    expect(result.event.company).toBe('数产集团');
  });

  it('仅登记链接时明确降低置信度', () => {
    const result = analyzeMaterial({ title: '', url: 'https://mp.weixin.qq.com/s/example' });
    expect(result.source.status).toBe('待补全文');
    expect(result.event.confidence).toBe('低');
    expect(result.event.type).toBe('材料待核验');
  });
});

describe('公众号链接校验', () => {
  it('只接受 https 微信公众号文章链接', () => {
    expect(isWechatArticleUrl('https://mp.weixin.qq.com/s/abc')).toBe(true);
    expect(isWechatArticleUrl('http://mp.weixin.qq.com/s/abc')).toBe(false);
    expect(isWechatArticleUrl('https://example.com/article')).toBe(false);
  });
});
