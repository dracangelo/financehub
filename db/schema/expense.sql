-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamp default now()
);

-- MERCHANTS (with optional intelligence metadata)
create table merchants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  avg_monthly_spend numeric,
  insights jsonb,
  created_at timestamp default now()
);

-- EXPENSES
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  merchant_id uuid references merchants(id),
  merchant_name text,
  amount numeric not null,
  category text,
  description text,
  location geography(Point, 4326),
  spent_at timestamp not null,
  time_of_day text generated always as (
    case
      when extract(hour from spent_at) between 0 and 5 then 'Late Night'
      when extract(hour from spent_at) between 6 and 11 then 'Morning'
      when extract(hour from spent_at) between 12 and 17 then 'Afternoon'
      else 'Evening'
    end
  ) stored,
  is_recurring boolean default false,
  created_at timestamp default now()
);

-- EXPENSE SPLITS
create table expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  shared_with_name text not null,
  amount numeric not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp default now()
);

-- RECEIPTS (linked to expenses)
create table receipts (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  image_url text,
  text_content text, -- for searchable OCR
  warranty_expiry date,
  receipt_date date,
  created_at timestamp default now()
);

-- VOICE MEMOS
create table voice_memos (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  audio_url text,
  transcript text,
  created_at timestamp default now()
);

-- RECURRING TRANSACTIONS
create table recurring_patterns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  merchant_id uuid references merchants(id),
  category text,
  avg_amount numeric,
  frequency text, -- e.g., 'monthly', 'weekly'
  next_due date,
  is_subscription boolean default true,
  created_at timestamp default now()
);

-- AR OVERLAY INFO (for scanned receipts, optional)
create table ar_receipt_overlays (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references receipts(id) on delete cascade,
  metadata jsonb, -- e.g., { "product": "Air Fryer", "price": 100 }
  highlights text[],
  created_at timestamp default now()
);

-- INTERACTION LOGS (for building smart defaults)
create table expense_interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  interaction_type text check (interaction_type in ('tap-entry', 'voice', 'scan', 'suggestion')),
  context jsonb,
  created_at timestamp default now()
);
