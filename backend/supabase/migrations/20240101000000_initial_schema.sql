-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "vector" with schema extensions;

-- Enable Row Level Security
alter table if exists public.users enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.stories enable row level security;
alter table if exists public.test_cases enable row level security;

-- Users table
create table if not exists public.users (
  id uuid not null default uuid_generate_v4(),
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
);

-- Projects table
create table if not exists public.projects (
  id uuid not null default uuid_generate_v4(),
  name text not null,
  description text,
  jira_id text,
  created_by uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint projects_pkey primary key (id),
  constraint projects_created_by_fkey foreign key (created_by) references auth.users (id) on delete cascade
);

-- Documents table with vector embedding
create table if not exists public.documents (
  id uuid not null default uuid_generate_v4(),
  project_id uuid not null,
  name text not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_by uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint documents_pkey primary key (id),
  constraint documents_project_id_fkey foreign key (project_id) references projects (id) on delete cascade,
  constraint documents_created_by_fkey foreign key (created_by) references auth.users (id) on delete cascade
);

-- Stories table
create table if not exists public.stories (
  id uuid not null default uuid_generate_v4(),
  project_id uuid not null,
  title text not null,
  description text not null,
  acceptance_criteria text[] not null default '{}',
  status text not null check (status in ('draft', 'in_review', 'approved', 'in_progress', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  jira_id text,
  story_points integer,
  business_value text,
  created_by uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint stories_pkey primary key (id),
  constraint stories_project_id_fkey foreign key (project_id) references projects (id) on delete cascade,
  constraint stories_created_by_fkey foreign key (created_by) references auth.users (id) on delete cascade
);

-- Test Cases table
create table if not exists public.test_cases (
  id uuid not null default uuid_generate_v4(),
  story_id uuid not null,
  title text not null,
  description text not null,
  steps jsonb not null default '[]'::jsonb,
  expected_result text not null,
  status text not null check (status in ('draft', 'in_review', 'approved', 'in_progress', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  jira_id text,
  preconditions text,
  postconditions text,
  created_by uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint test_cases_pkey primary key (id),
  constraint test_cases_story_id_fkey foreign key (story_id) references stories (id) on delete cascade,
  constraint test_cases_created_by_fkey foreign key (created_by) references auth.users (id) on delete cascade
);

-- Function to update the updated_at column
execute format('create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone(''utc''::text, now());
  return new;
end;
$$ language plpgsql security definer;');

-- Create triggers to update updated_at columns
create or replace trigger handle_updated_at before update on public.users
  for each row execute procedure update_updated_at();

create or replace trigger handle_updated_at before update on public.projects
  for each row execute procedure update_updated_at();

create or replace trigger handle_updated_at before update on public.documents
  for each row execute procedure update_updated_at();

create or replace trigger handle_updated_at before update on public.stories
  for each row execute procedure update_updated_at();

create or replace trigger handle_updated_at before update on public.test_cases
  for each row execute procedure update_updated_at();

-- Function for document similarity search
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
