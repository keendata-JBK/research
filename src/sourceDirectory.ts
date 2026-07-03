import type { SourceRef } from './types';

const officialSources: Record<string, SourceRef[]> = {
  智谱: [{ name: '智谱官网', kind: '官网', url: 'https://www.zhipuai.cn/' }],
  DeepSeek: [{ name: 'DeepSeek 官网', kind: '官网', url: 'https://www.deepseek.com/' }, { name: 'DeepSeek GitHub', kind: 'RSS', url: 'https://github.com/deepseek-ai' }],
  华为昇腾: [{ name: '华为新闻', kind: '官网', url: 'https://www.huawei.com/cn/news' }],
  中科曙光: [{ name: '中科曙光新闻', kind: '官网', url: 'https://www.sugon.com/about/news?category_id=1&time=0' }],
  海光: [{ name: '海光信息官网', kind: '官网', url: 'https://www.hygon.cn/' }],
  天数智芯: [{ name: '天数智芯官网', kind: '官网', url: 'https://www.iluvatar.com/' }],
  清微智能: [{ name: '清微智能官网', kind: '官网', url: 'https://www.tsingmicro.com/' }],
  Databricks: [{ name: 'Databricks Blog', kind: '官网', url: 'https://www.databricks.com/blog' }],
  Snowflake: [{ name: 'Snowflake Blog', kind: '官网', url: 'https://www.snowflake.com/en/blog/' }],
  Palantir: [{ name: 'Palantir Newsroom', kind: '官网', url: 'https://www.palantir.com/newsroom/' }],
  星环科技: [{ name: '星环科技新闻', kind: '官网', url: 'https://www.transwarp.cn/news' }],
  滴普科技: [{ name: '滴普科技官网', kind: '官网', url: 'https://www.deepexi.com/' }],
  阿里云: [{ name: '阿里云新闻', kind: '官网', url: 'https://www.alibabacloud.com/zh/news' }],
  腾讯云: [{ name: '腾讯云官网', kind: '官网', url: 'https://cloud.tencent.com/' }],
  百度智能云: [{ name: '百度智能云官网', kind: '官网', url: 'https://cloud.baidu.com/' }],
  NVIDIA: [{ name: 'NVIDIA Newsroom', kind: '官网', url: 'https://nvidianews.nvidia.com/' }],
  寒武纪: [{ name: '寒武纪官网', kind: '官网', url: 'https://www.cambricon.com/' }],
  沐曦: [{ name: '沐曦官网', kind: '官网', url: 'https://www.metax-tech.com/' }],
  摩尔线程: [{ name: '摩尔线程官网', kind: '官网', url: 'https://www.mthreads.com/' }],
  ScaleAI: [{ name: 'Scale AI Blog', kind: '官网', url: 'https://scale.com/blog' }],
  'Scale AI': [{ name: 'Scale AI Blog', kind: '官网', url: 'https://scale.com/blog' }],
  Kimi: [{ name: 'Kimi 官网', kind: '官网', url: 'https://www.kimi.com/' }],
  MiniMax: [{ name: 'MiniMax 官网', kind: '官网', url: 'https://www.minimaxi.com/' }],
  袋鼠云: [{ name: '袋鼠云官网', kind: '官网', url: 'https://www.dtstack.com/' }],
  帆软: [{ name: '帆软官网', kind: '官网', url: 'https://www.fanruan.com/' }],
  数语科技: [{ name: '数语科技官网', kind: '官网', url: 'https://www.datablau.cn/' }],
};

export function getOfficialSources(company: string) {
  return officialSources[company] || [];
}
