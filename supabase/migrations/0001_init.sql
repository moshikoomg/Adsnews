-- ברירות מחדל לכל משתמש (המקטעים שננעצו בסטודיו)
create table if not exists public.user_defaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- פקודות רינדור
create table if not exists public.render_jobs (
  id uuid primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  status text not null default 'queued', -- queued | rendering | done | failed
  progress real default 0,
  payload jsonb not null,
  output_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_defaults enable row level security;
alter table public.render_jobs enable row level security;

create policy "own defaults" on public.user_defaults for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own jobs" on public.render_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.render_jobs;

-- Bucket לסרטונים
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict do nothing;
create policy "upload own videos" on storage.objects for insert to authenticated with check (bucket_id = 'videos');
