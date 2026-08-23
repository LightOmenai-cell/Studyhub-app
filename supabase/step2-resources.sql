-- Subjects table
create table if not exists subjects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  level text,
  department text,
  created_at timestamp with time zone default now()
);

-- Bookmarks table (for later, but let's set it up now)
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  resource_type text,
  resource_id text,
  resource_title text,
  created_at timestamp with time zone default now()
);

alter table bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Seed some sample subjects
insert into subjects (name, level, department) values
  ('Mathematics', 'SS3', 'Science'),
  ('Physics', 'SS3', 'Science'),
  ('Chemistry', 'SS3', 'Science'),
  ('Biology', 'SS3', 'Science'),
  ('English Language', 'SS3', null),
  ('Government', 'SS3', 'Arts'),
  ('Literature', 'SS3', 'Arts'),
  ('Economics', 'SS3', 'Commercial'),
  ('Accounting', 'SS3', 'Commercial')
on conflict do nothing;
