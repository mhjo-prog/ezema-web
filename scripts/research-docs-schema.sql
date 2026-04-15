create table if not exists research_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  constitution_type text,
  content text not null,
  created_at timestamptz default now()
);
