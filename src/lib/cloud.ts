import type { User } from '@supabase/supabase-js';
import type {
  Competitor,
  EventItem,
  IndustryTheme,
  KejieImplication,
  SourceMaterial,
  Viewpoint,
} from '../types';
import { supabase } from './supabase';

export type CloudSnapshot = {
  competitors: Competitor[];
  events: EventItem[];
  themes: IndustryTheme[];
  viewpoints: Viewpoint[];
  implications: KejieImplication[];
  sources: SourceMaterial[];
};

export type CloudProfile = { displayName: string; role: 'leader' | 'editor' | 'reviewer' | 'admin' };

function client() {
  if (!supabase) throw new Error('Supabase 尚未配置');
  return supabase;
}

function ensureOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await client().auth.getSession();
  ensureOk(error);
  return data.session?.user || null;
}

export async function getProfile(user: User): Promise<CloudProfile> {
  const { data, error } = await client().from('profiles').select('display_name, role').eq('id', user.id).single();
  ensureOk(error);
  if (!data) throw new Error('未找到用户资料');
  return { displayName: data.display_name || user.email || '用户', role: data.role };
}

export async function sendMagicLink(email: string) {
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await client().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  ensureOk(error);
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  ensureOk(error);
}

export async function loadCloudSnapshot(): Promise<CloudSnapshot> {
  const db = client();
  const [competitorResult, eventResult, themeResult, viewpointResult, implicationResult, sourceResult] = await Promise.all([
    db.from('competitors').select('*, competitor_sources(*)').order('created_at', { ascending: false }),
    db.from('competitor_events').select('*, competitors(name)').order('event_time', { ascending: false }),
    db.from('industry_themes').select('*').order('hot', { ascending: false }),
    db.from('viewpoints').select('*').order('created_at', { ascending: false }),
    db.from('kejie_implications').select('*').order('created_at', { ascending: false }),
    db.from('source_materials').select('*, competitors(name)').order('imported_at', { ascending: false }),
  ]);

  [competitorResult, eventResult, themeResult, viewpointResult, implicationResult, sourceResult]
    .forEach((result) => ensureOk(result.error));

  const competitors = (competitorResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    name: row.name,
    type: row.type,
    logo: row.name.slice(0, 2),
    status: row.status,
    summary: row.summary || '等待补充画像。',
    tags: row.tags || [],
    cooperation: row.cooperation || '待评估',
    priority: row.priority,
    sources: (row.competitor_sources || []).map((source: Record<string, unknown>) => ({
      name: String(source.name || ''),
      kind: source.kind as Competitor['sources'] extends Array<infer T> ? T extends { kind: infer K } ? K : never : never,
      url: source.url ? String(source.url) : undefined,
    })),
  })) as Competitor[];

  const events = (eventResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    company: row.competitors?.name || '待识别对象',
    date: row.event_time,
    type: row.event_type,
    title: row.title,
    summary: row.fact_summary || '',
    source: 'Supabase 情报库',
    impact: row.impact,
    tags: row.tags || [],
    heat: row.heat,
  })) as EventItem[];

  const themes = (themeResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    name: row.name,
    summary: row.summary || '',
    hot: row.hot,
    delta: row.delta,
    expressions: row.expressions || [],
    companies: row.companies || [],
    kejieAngle: row.kejie_angle || undefined,
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
  })) as IndustryTheme[];

  const viewpoints = (viewpointResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    title: row.title,
    source: row.source_label || 'Supabase 情报库',
    rawExpression: row.raw_expression || '',
    kejieRewrite: row.kejie_rewrite,
    scenes: row.scenes || [],
    status: row.review_status,
    confidence: row.confidence,
    mapBranch: row.map_branch || undefined,
    reasoning: row.reasoning || [],
  })) as Viewpoint[];

  const implications = (implicationResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    category: row.category,
    title: row.title,
    insight: row.insight,
    action: row.suggested_action || '',
    status: row.review_status,
    owner: row.owner || undefined,
    priority: row.priority,
    productMoves: row.product_moves || [],
  })) as KejieImplication[];

  const sources = (sourceResult.data || []).map((row) => ({
    id: row.legacy_id || row.id,
    title: row.title,
    publisher: row.publisher || '未注明来源',
    url: row.url || undefined,
    importedAt: row.imported_at?.slice(0, 10) || '',
    summary: row.summary || '',
    tags: row.tags || [],
    status: row.status,
    company: row.competitors?.name || undefined,
    evidence: row.evidence || undefined,
  })) as SourceMaterial[];

  return { competitors, events, themes, viewpoints, implications, sources };
}

async function findCompetitorId(name: string) {
  if (!name || name === '待识别对象') return null;
  const { data, error } = await client().from('competitors').select('id').eq('name', name).maybeSingle();
  ensureOk(error);
  return data?.id || null;
}

export async function saveCompetitor(item: Competitor) {
  const db = client();
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录后再同步');
  const { data, error } = await db.from('competitors').upsert({
    legacy_id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    priority: item.priority || 'P1',
    cooperation: item.cooperation,
    summary: item.summary,
    tags: item.tags,
    created_by: user.id,
  }, { onConflict: 'name' }).select('id').single();
  ensureOk(error);
  if (!data) throw new Error('竞合对象保存失败');
  if (item.sources?.length) {
    const sourceResult = await db.from('competitor_sources').insert(item.sources.map((source) => ({
      competitor_id: data.id,
      kind: source.kind,
      name: source.name,
      url: source.url || null,
    })));
    ensureOk(sourceResult.error);
  }
}

export async function deleteCompetitor(item: Competitor) {
  const query = item.id.startsWith('custom_')
    ? client().from('competitors').delete().eq('legacy_id', item.id)
    : client().from('competitors').delete().eq('id', item.id);
  const { error } = await query;
  ensureOk(error);
}

export async function saveAnalyzedMaterial(payload: {
  source: SourceMaterial;
  event: EventItem;
  theme: IndustryTheme;
  viewpoint: Viewpoint;
  implication: KejieImplication;
}) {
  const db = client();
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录后再同步');
  const competitorId = await findCompetitorId(payload.event.company);

  const sourceResult = await db.from('source_materials').upsert({
    legacy_id: payload.source.id,
    title: payload.source.title,
    publisher: payload.source.publisher,
    imported_at: new Date().toISOString(),
    url: payload.source.url || null,
    summary: payload.source.summary,
    tags: payload.source.tags,
    competitor_id: competitorId,
    status: payload.source.status || '待处理',
    evidence: payload.source.evidence || null,
    imported_by: user.id,
  }, { onConflict: 'legacy_id' }).select('id').single();
  ensureOk(sourceResult.error);
  if (!sourceResult.data) throw new Error('材料来源保存失败');

  const eventResult = await db.from('competitor_events').upsert({
    legacy_id: payload.event.id,
    competitor_id: competitorId,
    source_id: sourceResult.data.id,
    event_time: payload.event.date,
    event_type: payload.event.type,
    title: payload.event.title,
    fact_summary: payload.event.summary,
    impact: payload.event.impact,
    tags: payload.event.tags,
    heat: payload.event.heat,
    created_by: user.id,
  }, { onConflict: 'legacy_id' });
  ensureOk(eventResult.error);

  const themeResult = await db.from('industry_themes').upsert({
    legacy_id: payload.theme.id,
    name: payload.theme.name,
    summary: payload.theme.summary,
    hot: payload.theme.hot,
    delta: payload.theme.delta,
    expressions: payload.theme.expressions,
    companies: payload.theme.companies,
    kejie_angle: payload.theme.kejieAngle || null,
  }, { onConflict: 'name' });
  ensureOk(themeResult.error);

  const viewpointResult = await db.from('viewpoints').upsert({
    legacy_id: payload.viewpoint.id,
    title: payload.viewpoint.title,
    source_label: payload.viewpoint.source,
    raw_expression: payload.viewpoint.rawExpression,
    kejie_rewrite: payload.viewpoint.kejieRewrite,
    scenes: payload.viewpoint.scenes,
    review_status: payload.viewpoint.status,
    confidence: payload.viewpoint.confidence || '中',
    map_branch: payload.viewpoint.mapBranch || null,
    reasoning: payload.viewpoint.reasoning || [],
    created_by: user.id,
  }, { onConflict: 'legacy_id' }).select('id').single();
  ensureOk(viewpointResult.error);
  if (!viewpointResult.data) throw new Error('观点保存失败');

  const implicationResult = await db.from('kejie_implications').upsert({
    legacy_id: payload.implication.id,
    category: payload.implication.category,
    title: payload.implication.title,
    insight: payload.implication.insight,
    suggested_action: payload.implication.action,
    owner: payload.implication.owner || null,
    priority: payload.implication.priority || '中',
    product_moves: payload.implication.productMoves || [],
    review_status: payload.implication.status,
    created_by: user.id,
  }, { onConflict: 'legacy_id' }).select('id').single();
  ensureOk(implicationResult.error);
  if (!implicationResult.data) throw new Error('科杰启发保存失败');

  const linkResults = await Promise.all([
    db.from('viewpoint_sources').upsert({ viewpoint_id: viewpointResult.data.id, source_id: sourceResult.data.id }),
    db.from('implication_sources').upsert({ implication_id: implicationResult.data.id, source_id: sourceResult.data.id }),
  ]);
  linkResults.forEach((result) => ensureOk(result.error));
}
