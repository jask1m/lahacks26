-- Add unique constraint on project name
alter table public.projects add constraint projects_name_unique unique (name);
