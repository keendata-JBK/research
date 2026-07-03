-- KeenData Strategy Hub: private collaborative data model
create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'leader' check (role in ('leader','editor','reviewer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null unique,
  type text not null,
  status text not null default '观察中',
  priority text not null default 'P1' check (priority in ('P0','P1','P2')),
  cooperation text,
  summary text,
  tags text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitor_sources (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  kind text not null check (kind in ('公众号','官网','RSS','研报','内部材料')),
  name text not null,
  url text,
  scan_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.source_materials (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  source_type text not null default '网页',
  title text not null,
  author text,
  publisher text,
  published_at timestamptz,
  imported_at timestamptz not null default now(),
  url text,
  raw_text text,
  summary text,
  tags text[] not null default '{}',
  competitor_id uuid references public.competitors(id) on delete set null,
  status text not null default '待处理' check (status in ('待补全文','待处理','已处理','已归档')),
  evidence text,
  storage_path text,
  metadata jsonb not null default '{}',
  imported_by uuid references auth.users(id)
);

create unique index if not exists source_materials_url_unique
  on public.source_materials(url) where url is not null and url <> '';

create table if not exists public.competitor_events (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  competitor_id uuid references public.competitors(id) on delete set null,
  source_id uuid references public.source_materials(id) on delete set null,
  event_time date not null default current_date,
  event_type text not null default '行业动态',
  title text not null,
  fact_summary text,
  competitor_expression text,
  strategic_intent text,
  impact_to_kejie text,
  recommended_action text,
  impact text not null default '中' check (impact in ('高','中','低')),
  confidence text not null default '中' check (confidence in ('高','中','低')),
  tags text[] not null default '{}',
  heat integer not null default 50 check (heat between 0 and 100),
  review_status text not null default '待审核',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.industry_themes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null unique,
  summary text,
  hot integer not null default 50 check (hot between 0 and 100),
  delta integer not null default 0,
  expressions text[] not null default '{}',
  companies text[] not null default '{}',
  kejie_angle text,
  evidence jsonb not null default '[]',
  review_status text not null default '待审核',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.viewpoints (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null,
  source_label text,
  raw_expression text,
  kejie_rewrite text not null,
  scenes text[] not null default '{}',
  review_status text not null default '待审核',
  confidence text not null default '中' check (confidence in ('高','中','低')),
  map_branch text,
  reasoning text[] not null default '{}',
  embedding vector(1536),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.viewpoint_sources (
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  source_id uuid not null references public.source_materials(id) on delete cascade,
  primary key (viewpoint_id, source_id)
);

create table if not exists public.kejie_implications (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  category text not null,
  title text not null,
  insight text not null,
  suggested_action text,
  owner text,
  priority text not null default '中' check (priority in ('高','中','低')),
  product_moves text[] not null default '{}',
  review_status text not null default '待审核',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.implication_sources (
  implication_id uuid not null references public.kejie_implications(id) on delete cascade,
  source_id uuid not null references public.source_materials(id) on delete cascade,
  primary key (implication_id, source_id)
);

create table if not exists public.product_moves (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  product text not null,
  direction text not null,
  competitor_signal text,
  current_gap text,
  next_release text,
  owner text,
  priority text not null default 'P1' check (priority in ('P0','P1','P2')),
  status text not null default '候选',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leader_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null unique,
  title text not null,
  summary text,
  content jsonb not null default '{}',
  review_status text not null default '待审核',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  from_status text,
  to_status text,
  comment text,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','competitors','competitor_events','industry_themes','viewpoints','kejie_implications','product_moves','leader_briefs']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  initial_role text;
begin
  select case when exists (select 1 from public.profiles) then 'leader' else 'admin' end
    into initial_role;
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email), initial_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'leader');
$$;

grant execute on function public.current_app_role() to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','competitors','competitor_sources','source_materials','competitor_events',
    'industry_themes','viewpoints','viewpoint_sources','kejie_implications',
    'implication_sources','product_moves','leader_briefs','review_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_read on public.%I', table_name);
    execute format('create policy authenticated_read on public.%I for select to authenticated using (true)', table_name);
    execute format('drop policy if exists editor_insert on public.%I', table_name);
    execute format('create policy editor_insert on public.%I for insert to authenticated with check (public.current_app_role() in (''editor'',''reviewer'',''admin''))', table_name);
    execute format('drop policy if exists editor_update on public.%I', table_name);
    execute format('create policy editor_update on public.%I for update to authenticated using (public.current_app_role() in (''editor'',''reviewer'',''admin'')) with check (public.current_app_role() in (''editor'',''reviewer'',''admin''))', table_name);
    execute format('drop policy if exists admin_delete on public.%I', table_name);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.current_app_role() = ''admin'')', table_name);
  end loop;
end $$;

-- Profiles are managed by the auth trigger and admins only. Do not allow an
-- editor to promote their own role through the generic table policy above.
drop policy if exists editor_insert on public.profiles;
drop policy if exists editor_update on public.profiles;
drop policy if exists admin_delete on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'source-materials',
  'source-materials',
  false,
  52428800,
  array['application/pdf','text/plain','text/markdown','image/png','image/jpeg','image/webp']
)
on conflict (id) do update set public = false;

drop policy if exists source_materials_read on storage.objects;
create policy source_materials_read on storage.objects
  for select to authenticated
  using (bucket_id = 'source-materials');

drop policy if exists source_materials_insert on storage.objects;
create policy source_materials_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'source-materials' and public.current_app_role() in ('editor','reviewer','admin'));

drop policy if exists source_materials_update on storage.objects;
create policy source_materials_update on storage.objects
  for update to authenticated
  using (bucket_id = 'source-materials' and public.current_app_role() in ('editor','reviewer','admin'))
  with check (bucket_id = 'source-materials' and public.current_app_role() in ('editor','reviewer','admin'));

drop policy if exists source_materials_delete on storage.objects;
create policy source_materials_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'source-materials' and public.current_app_role() = 'admin');

comment on schema public is 'KeenData Strategy Hub private collaborative data model';
