export type Impact = '高' | '中' | '低';
export type ReviewStatus = '待审核' | '已发布' | '母版候选' | '已同步';

export interface Competitor {
  id: string;
  name: string;
  type: string;
  logo: string;
  status: string;
  summary: string;
  tags: string[];
  cooperation: string;
}

export interface EventItem {
  id: string;
  company: string;
  date: string;
  type: string;
  title: string;
  summary: string;
  source: string;
  impact: Impact;
  tags: string[];
  heat: number;
}

export interface IndustryTheme {
  id: string;
  name: string;
  summary: string;
  hot: number;
  delta: number;
  expressions: string[];
  companies: string[];
}

export interface Viewpoint {
  id: string;
  title: string;
  source: string;
  rawExpression: string;
  kejieRewrite: string;
  scenes: string[];
  status: ReviewStatus;
}

export interface KejieImplication {
  id: string;
  category: string;
  title: string;
  insight: string;
  action: string;
  status: ReviewStatus;
}

export interface SourceMaterial {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  importedAt: string;
  summary: string;
  tags: string[];
}
