-- 🔧 UTILITY FUNCTION
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 👤 USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create trigger set_users_updated_at
before update on users
for each row
when (old.* is distinct from new.*)
execute procedure set_updated_at();

-- 📊 BUDGET MODELS
create table budget_models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type text check (type in ('traditional', 'zero-based', '50/30/20', 'envelope')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create trigger set_budget_models_updated_at
before update on budget_models
for each row
when (old.* is distinct from new.*)
execute procedure set_updated_at();

-- 🧾 USER BUDGETS
create table budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  model_id uuid references budget_models(id),
  name text,
  income numeric not null,
  start_date date,
  end_date date,
  is_collaborative boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create trigger set_budgets_updated_at
before update on budgets
for each row
when (old.* is distinct from new.*)
execute procedure set_updated_at();

-- 👥 BUDGET COLLABORATORS
create table budget_collaborators (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  collaborator_id uuid references users(id),
  role text default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamp default now()
);

-- 📂 CATEGORIES & SUBCATEGORIES
create table budget_categories (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  name text not null,
  parent_id uuid references budget_categories(id),
  amount_allocated numeric not null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  category_id uuid references categories(id)
);

-- Add index for budget_id for faster lookups
create index idx_budget_categories_budget_id on budget_categories(budget_id);

-- Add index for category_id for faster lookups
create index idx_budget_categories_category_id on budget_categories(category_id);

create trigger set_budget_categories_updated_at
before update on budget_categories
for each row
when (old.* is distinct from new.*)
execute procedure set_updated_at();

-- 💸 SPENDING HISTORY
create table spending_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  category_id uuid references budget_categories(id),
  amount numeric,
  description text,
  spent_on date,
  created_at timestamp default now()
);

-- 🔧 DYNAMIC ADJUSTMENTS
create table budget_adjustments (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id),
  category_id uuid references budget_categories(id),
  old_amount numeric,
  new_amount numeric,
  reason text,
  adjustment_date timestamp default now()
);

-- 🔮 SCENARIO PLANNING
create table budget_scenarios (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id),
  name text,
-- 🧰 TEMPLATES
create table budget_templates (
  id uuid primary key default uuid_generate_v4(),
  name text,
  description text,
  use_case text,
  template_data jsonb,
  created_at timestamp default now()
);

-- ⚖️ VARIANCE TRACKING
create table budget_variances (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id),
  category_id uuid references budget_categories(id),
  expected numeric,
  actual numeric,
  variance numeric generated always as (actual - expected) stored,
  created_at timestamp default now()
);

-- 🔄 TRANSACTION MANAGEMENT
create or replace function begin_transaction()
returns void as $$
begin
  execute 'begin';
end;
$$ language plpgsql;

create or replace function commit_transaction()
returns void as $$
begin
  execute 'commit';
end;
$$ language plpgsql;

create or replace function rollback_transaction()
returns void as $$
begin
  execute 'rollback';
end;
$$ language plpgsql;

-- 🔔 NOTIFICATIONS
create table budget_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  budget_id uuid references budgets(id),
  category_id uuid references budget_categories(id),
  type text check (type in ('over-budget', 'milestone', 'spending-alert')),
  message text,
  created_at timestamp default now()
);

-- 🎯 FINANCIAL GOALS
create table budget_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('savings', 'investment', 'debt', 'emergency')),
  target numeric not null,
  current_progress numeric default 0,
  priority integer,
  deadline date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create trigger set_budget_goals_updated_at
before update on budget_goals
for each row
when (old.* is distinct from new.*)
execute procedure set_updated_at();
