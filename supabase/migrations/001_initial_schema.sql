-- Projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- Tests table
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text not null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Test runs table
create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.tests(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending','running','passed','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Test run steps table
create table public.test_run_steps (
  id uuid primary key default gen_random_uuid(),
  test_run_id uuid references public.test_runs(id) on delete cascade not null,
  step_index integer not null,
  status text not null default 'pending' check (status in ('pending','running','passed','failed','skipped')),
  screenshot_url text,
  details text,
  started_at timestamptz,
  completed_at timestamptz
);

-- Create storage bucket for screenshots
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true);

-- Allow anyone to upload screenshots (no auth for MVP)
create policy "Anyone can upload screenshots"
  on storage.objects for insert
  with check (bucket_id = 'screenshots');

-- Allow anyone to view screenshots
create policy "Anyone can view screenshots"
  on storage.objects for select
  using (bucket_id = 'screenshots');
