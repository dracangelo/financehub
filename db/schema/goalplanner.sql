
-- ENUM TYPES
create type goal_type_enum as enum ('education', 'retirement', 'home', 'vacation', 'emergency', 'custom');
create type funding_strategy_enum as enum ('round_up', 'income_split', 'manual');
create type urgency_level_enum as enum ('low', 'medium', 'high');
create type impact_level_enum as enum ('low', 'medium', 'high');
create type relationship_type_enum as enum ('precedes', 'depends_on', 'enhances');
create type access_level_enum as enum ('view', 'comment', 'collaborate');

-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- GOAL TEMPLATES
create table goal_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  recommended_strategy text,
  estimated_duration_months int,
  default_milestones jsonb,
  goal_type goal_type_enum not null,
  created_at timestamp default now()
);

-- USER GOALS
create table user_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  template_id uuid references goal_templates(id),
  name text not null,
  description text,
  target_amount numeric not null check (target_amount > 0),
  current_savings numeric default 0 check (current_savings >= 0),
  start_date date,
  target_date date,
  goal_type goal_type_enum,
  image_url text,
  priority int default 1,
  funding_strategy funding_strategy_enum,
  is_shared boolean default false,
  is_achieved boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- GOAL MILESTONES
create table goal_milestones (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references user_goals(id) on delete cascade,
  name text not null,
  description text,
  amount_target numeric check (amount_target >= 0),
  achieved boolean default false,
  achieved_at timestamp,
  celebration_triggered boolean default false,
  image_url text,
  created_at timestamp default now()
);

-- GOAL FUNDING TRANSACTIONS
create table goal_funding (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references user_goals(id) on delete cascade,
  amount numeric not null check (amount > 0),
  source funding_strategy_enum,
  transaction_date timestamp default now()
);

-- GOAL PRIORITY MATRIX
create table goal_priority_matrix (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  goal_id uuid references user_goals(id) on delete cascade,
  priority_score numeric check (priority_score >= 0),
  urgency_level urgency_level_enum,
  impact_level impact_level_enum,
  notes text,
  created_at timestamp default now()
);

-- GOAL RELATIONSHIPS
create table goal_relationships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  parent_goal_id uuid references user_goals(id) on delete cascade,
  child_goal_id uuid references user_goals(id) on delete cascade,
  relationship_type relationship_type_enum,
  created_at timestamp default now()
);

-- SOCIAL GOAL SHARING
create table goal_shares (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references user_goals(id) on delete cascade,
  shared_with_email text not null,
  shared_message text,
  access_level access_level_enum default 'view',
  invited_at timestamp default now()
);

-- GOAL ACHIEVEMENTS
create table goal_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  goal_id uuid references user_goals(id),
  milestone_id uuid references goal_milestones(id),
  description text,
  achieved_at timestamp default now(),
  is_shared boolean default false,
  celebration_type text,
  created_at timestamp default now()
);

-- ROUND-UP SETTINGS
create table round_up_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  is_enabled boolean default false,
  rounding_base numeric default 1.00 check (rounding_base > 0),
  funding_goal_id uuid references user_goals(id),
  created_at timestamp default now()
);

-- INCOME SPLIT RULES
create table income_split_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  goal_id uuid references user_goals(id),
  split_percentage numeric check (split_percentage >= 0 and split_percentage <= 100),
  is_active boolean default true,
  created_at timestamp default now()
);

-- TRIGGER FUNCTION FOR MILESTONE CELEBRATION
create or replace function trigger_milestone_celebration()
returns trigger as $$
begin
  if NEW.achieved = true and (OLD.achieved is distinct from true) then
    insert into goal_achievements (
      user_id,
      goal_id,
      milestone_id,
      description,
      celebration_type
    )
    select
      ug.user_id,
      gm.goal_id,
      gm.id,
      'Milestone "' || gm.name || '" achieved!',
      'confetti'
    from goal_milestones gm
    join user_goals ug on ug.id = gm.goal_id
    where gm.id = NEW.id;

    update goal_milestones
    set celebration_triggered = true
    where id = NEW.id;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger trg_milestone_celebration
after update on goal_milestones
for each row
when (NEW.achieved = true and OLD.achieved is distinct from true)
execute procedure trigger_milestone_celebration();
