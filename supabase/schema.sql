-- Run this once in Supabase → SQL Editor (safe to re-run)
create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,
  data jsonb not null,          -- full surprise (owner only)
  pub jsonb,                    -- what the public link serves (encrypted when a question lock is set)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.scenes add column if not exists pub jsonb;
alter table public.scenes enable row level security;
drop policy if exists "owner select" on public.scenes; drop policy if exists "owner insert" on public.scenes;
drop policy if exists "owner update" on public.scenes; drop policy if exists "owner delete" on public.scenes;
create policy "owner select" on public.scenes for select using (owner = auth.uid());
create policy "owner insert" on public.scenes for insert with check (owner = auth.uid());
create policy "owner update" on public.scenes for update using (owner = auth.uid());
create policy "owner delete" on public.scenes for delete using (owner = auth.uid());

-- Public link: opens ONE surprise by id. The date lock is enforced here, on the server.
create or replace function public.get_scene(sid uuid) returns jsonb
language sql security definer set search_path = public as $$
  select case
    when nullif(data->>'unlockAt','') is not null and (data->>'unlockAt')::timestamptz > now()
      then jsonb_build_object('waiting', data->>'unlockAt', 'to', data->>'to')
    else coalesce(pub, data) end
  from public.scenes where id = sid;
$$;
grant execute on function public.get_scene(uuid) to anon, authenticated;

-- Replies from the people who open your surprise
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);
alter table public.replies enable row level security;
drop policy if exists "owner reads replies" on public.replies;
create policy "owner reads replies" on public.replies for select
  using (exists (select 1 from public.scenes s where s.id = scene_id and s.owner = auth.uid()));
create or replace function public.add_reply(sid uuid, r jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(r::text) > 2000 then raise exception 'reply too long'; end if;
  if not exists (select 1 from scenes where id = sid) then raise exception 'not found'; end if;
  insert into replies(scene_id, data) values (sid, r);
end $$;
grant execute on function public.add_reply(uuid, jsonb) to anon, authenticated;

-- Community template gallery (visuals only: no photos, notes or names)
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner uuid default auth.uid(),
  name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);
alter table public.templates enable row level security;
create or replace function public.publish_template(n text, d jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if length(d::text) > 6000 then raise exception 'template too big'; end if;
  insert into templates(owner, name, data) values (auth.uid(), left(n, 40), d);
end $$;
grant execute on function public.publish_template(text, jsonb) to authenticated;
create or replace function public.list_templates() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'data', data)), '[]'::jsonb)
  from (select * from public.templates order by created_at desc limit 24) t;
$$;
grant execute on function public.list_templates() to anon, authenticated;
