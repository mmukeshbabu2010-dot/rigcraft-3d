-- RigCraft 3D parts catalogue foundation
-- Apply via Supabase SQL Editor or Supabase CLI: supabase db push
create extension if not exists pgcrypto;

create table if not exists public.part_categories (
  id text primary key,
  label text not null unique,
  sort_order integer not null default 0
);

insert into public.part_categories(id,label,sort_order) values
 ('cases','Cases',10),('motherboards','Motherboards',20),('cpus','CPUs',30),('gpus','Graphics cards',40),('coolers','CPU coolers',50),('ram','Memory',60),('storage','Storage',70),('psus','Power supplies',80),('fans','Fans',90)
on conflict (id) do nothing;

create table if not exists public.parts (
  id text primary key,
  category_id text not null references public.part_categories(id),
  manufacturer text,
  model text not null,
  display_name text not null,
  specs jsonb not null default '{}'::jsonb,
  image_url text,
  product_url text,
  source_name text,
  source_url text,
  source_checked_at timestamptz,
  data_status text not null default 'unverified' check (data_status in ('unverified','verified','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists parts_category_idx on public.parts(category_id);
create index if not exists parts_status_category_idx on public.parts(data_status,category_id);
create index if not exists parts_name_search_idx on public.parts using gin (to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(manufacturer,'') || ' ' || coalesce(model,'')));
create index if not exists parts_specs_gin_idx on public.parts using gin(specs);

create or replace function public.set_parts_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists parts_updated_at on public.parts;
create trigger parts_updated_at before update on public.parts for each row execute function public.set_parts_updated_at();

alter table public.part_categories enable row level security;
alter table public.parts enable row level security;
-- Catalogue browsing is public; only verified rows are exposed to anon/authenticated clients.
drop policy if exists "Public can read catalogue categories" on public.part_categories;
create policy "Public can read catalogue categories" on public.part_categories for select to anon, authenticated using (true);
drop policy if exists "Public can read verified parts" on public.parts;
create policy "Public can read verified parts" on public.parts for select to anon, authenticated using (data_status = 'verified');
-- No client write policies: catalog mutations must use trusted admin tooling/SQL with privileged credentials.
grant select on public.part_categories to anon, authenticated;
grant select on public.parts to anon, authenticated;
revoke insert, update, delete on public.parts from anon, authenticated;
revoke insert, update, delete on public.part_categories from anon, authenticated;
