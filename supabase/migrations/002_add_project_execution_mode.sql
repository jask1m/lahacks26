alter table public.projects
add column execution_mode text not null default 'browserbase'
check (execution_mode in ('browserbase', 'local'));
