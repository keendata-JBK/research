export type Impact = '高' | '中' | '低';
export type ReviewStatus = '待审核' | '已精选' | '已改写' | '已发布' | '母版候选' | '已同步' | '已归档';

export interface SourceRef {
  name: string;
  kind: '公众号' | '官网' | 'RSS' | '研报' | '内部材料';
  url?: string;
}

export interface Competitor {
  id: string;
  name: string;
  type: string;
  logo: string;
  status: string;
  summary: string;
  tags: string[];
  cooperation: string;
  priority?: 'P0' | 'P1' | 'P2';
  sources?: SourceRef[];
}

export interface EventItem {
  id: string;
  company: string;
  date: string;
  type: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  impact: Impact;
  tags: string[];
  heat: number;
  publishedAt?: string;
  whatHappened?: string;
  competitorExpression?: string;
  strategicMeaning?: string;
  kejieImpact?: string;
  confidence?: '高' | '中' | '低';
}

export interface KnowledgeEvidence {
  id: string;
  branchId: string;
  title: string;
  publisher: string;
  summary: string;
  url?: string;
  publishedAt?: string;
}

export interface KnowledgeBranch {
  id: string;
  order: number;
  title: string;
  statement: string;
  logic: string[];
  scenes: string[];
  productMapping: string[];
}

export interface KnowledgeMaster {
  generatedAt: string;
  version: string;
  title: string;
  thesis: string;
  branches: KnowledgeBranch[];
  evidence: KnowledgeEvidence[];
  updates: Array<{ id: string; type: string; title: string; summary: string; source?: string; sourceUrl?: string }>;
  stats: { branches: number; evidence: number; updates: number; candidateViewpoints: number };
}

export interface IndustryTheme {
  id: string;
  name: string;
  summary: string;
  hot: number;
  delta: number;
  expressions: string[];
  companies: string[];
  kejieAngle?: string;
  evidence?: string[];
}

export interface Viewpoint {
  id: string;
  title: string;
  source: string;
  rawExpression: string;
  kejieRewrite: string;
  scenes: string[];
  status: ReviewStatus;
  sourceIds?: string[];
  confidence?: '高' | '中' | '低';
  mapBranch?: string;
  reasoning?: string[];
}

export interface KejieImplication {
  id: string;
  category: string;
  title: string;
  insight: string;
  action: string;
  status: ReviewStatus;
  owner?: string;
  priority?: '高' | '中' | '低';
  sourceIds?: string[];
  productMoves?: string[];
}

export interface SourceMaterial {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  importedAt: string;
  summary: string;
  tags: string[];
  status?: '待补全文' | '待处理' | '已处理' | '已归档';
  company?: string;
  evidence?: string;
}

export interface ProductMove {
  id: string;
  product: string;
  direction: string;
  competitorSignal: string;
  currentGap: string;
  nextRelease: string;
  owner: string;
  priority: 'P0' | 'P1' | 'P2';
}
