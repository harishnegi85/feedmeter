-- FeedMeter Database Schema
-- Run this in your Supabase project SQL editor (Dashboard > SQL Editor > New query)

-- Sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  presenter_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  code text unique not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  active_question_index integer not null default 0,
  created_at timestamptz default now()
);

-- Questions
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  type text not null check (type in ('mcq', 'rating', 'word_cloud', 'open_text')),
  prompt text not null,
  options jsonb,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Participants (anonymous audience members)
create table if not exists participants (
  id uuid primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  joined_at timestamptz default now()
);

-- Responses
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  value text not null,
  created_at timestamptz default now(),
  unique(question_id, participant_id)
);

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table sessions    enable row level security;
alter table questions   enable row level security;
alter table participants enable row level security;
alter table responses   enable row level security;

-- Sessions: presenter manages their own; anyone can read non-draft sessions
create policy "Presenter full access to own sessions" on sessions
  for all using (auth.uid() = presenter_id);

create policy "Public can read active/ended sessions" on sessions
  for select using (status in ('active', 'ended'));

-- Questions: presenter manages via session ownership; public can read
create policy "Presenter manages questions" on questions
  for all using (
    exists (
      select 1 from sessions
      where sessions.id = questions.session_id
        and sessions.presenter_id = auth.uid()
    )
  );

create policy "Public can read questions" on questions
  for select using (true);

-- Participants: anyone can insert/read
create policy "Anyone can register as participant" on participants
  for insert with check (true);

create policy "Anyone can read participants" on participants
  for select using (true);

-- Responses: anyone can insert/read
create policy "Anyone can submit response" on responses
  for insert with check (true);

create policy "Anyone can read responses" on responses
  for select using (true);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime for live updates (run in SQL editor)
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table responses;
alter publication supabase_realtime add table participants;
