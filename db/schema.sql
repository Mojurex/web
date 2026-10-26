-- Шалгалтын системийн өгөгдлийн сан. Дахин ажиллуулахад аюулгүй (idempotent).
-- Бүх хандалт Next.js серверээр дамжина. RLS асаалттай, policy-гүй тул
-- Supabase-ийн нийтийн (anon) API-аар эдгээр хүснэгтийг унших боломжгүй.

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  grade int not null,
  variant text not null check (variant in ('A', 'B')),
  title text not null,
  topic text not null,
  access_code text not null unique,
  is_open boolean not null default false,
  section_a_minutes int not null default 20,
  section_b_minutes int not null default 40,
  notes jsonb not null default '[]',
  units jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- type: mcq | open | task. payload нь сурагчид харагдах хэсэг,
-- answer_key ба rubric нь зөвхөн багшид.
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  section text not null check (section in ('A', 'B')),
  position int not null,
  number text not null,
  type text not null check (type in ('mcq', 'open', 'task')),
  points numeric not null,
  prompt text not null,
  payload jsonb not null default '{}',
  answer_key jsonb not null default '{}',
  rubric jsonb not null default '[]'
);
create index if not exists questions_exam_idx on questions (exam_id, section, position);

-- section: A → B → done. token_hash нь сурагчийн браузерын cookie-ийн hash;
-- null бол багш дахин нэвтрэхийг зөвшөөрсөн гэсэн үг.
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  student_name text not null,
  student_code text not null,
  token_hash text,
  section text not null default 'A' check (section in ('A', 'B', 'done')),
  a_started_at timestamptz not null default now(),
  a_deadline timestamptz not null,
  a_submitted_at timestamptz,
  b_started_at timestamptz,
  b_deadline timestamptz,
  b_submitted_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (exam_id, student_code)
);

-- item_scores: рубрикийн мөр бүрийн оноо (null = шалгаагүй). mcq-д нэг мөр.
create table if not exists answers (
  attempt_id uuid not null references attempts (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  response jsonb not null default '{}',
  item_scores jsonb,
  comment text not null default '',
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

-- Focus mode: таб/цонх солих зөрчил. focus_limit = 0 бол зөвхөн бүртгэнэ.
alter table exams add column if not exists focus_limit int not null default 3;
alter table attempts add column if not exists focus_count int not null default 0;
alter table attempts add column if not exists focus_log jsonb not null default '[]';
alter table attempts add column if not exists ended_by_focus boolean not null default false;

alter table teachers enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table answers enable row level security;
