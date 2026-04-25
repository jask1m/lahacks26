create table public.test_auth_configs (
  test_id uuid primary key references public.tests(id) on delete cascade not null,
  mode text not null check (mode in ('configured', 'none')),
  config jsonb,
  username text,
  password text,
  credential_source text check (credential_source in ('manual', 'generated')),
  updated_at timestamptz default now() not null
);
