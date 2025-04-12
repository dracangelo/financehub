-- Shared Budget Members
create table shared_budget_members (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('owner', 'editor', 'viewer')),
  notification_preferences jsonb default '{
    "over_budget": true,
    "approaching_limit": true,
    "milestone_reached": true,
    "new_transaction": true
  }',
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(budget_id, user_id)
);

-- Budget Progress Tracking
create table budget_progress (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  category_id uuid references budget_categories(id) on delete cascade,
  current_amount numeric not null default 0,
  last_updated timestamp default now(),
  status text check (status in ('on_track', 'at_risk', 'over_budget')),
  trend jsonb, -- Store historical trend data
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Budget Notifications
create table budget_notifications (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('over_budget', 'approaching_limit', 'milestone_reached', 'new_transaction')),
  message text not null,
  data jsonb,
  read boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Triggers for notifications
create or replace function notify_budget_members()
returns trigger as $$
declare
  member_record record;
  notification_type text;
  notification_message text;
  notification_data jsonb;
begin
  -- Determine notification type and message based on the event
  if TG_TABLE_NAME = 'budget_progress' then
    if NEW.status = 'over_budget' then
      notification_type := 'over_budget';
      notification_message := format('Category %s is over budget', NEW.category_id);
      notification_data := jsonb_build_object(
        'category_id', NEW.category_id,
        'current_amount', NEW.current_amount
      );
    elsif NEW.status = 'at_risk' then
      notification_type := 'approaching_limit';
      notification_message := format('Category %s is approaching budget limit', NEW.category_id);
      notification_data := jsonb_build_object(
        'category_id', NEW.category_id,
        'current_amount', NEW.current_amount
      );
    end if;

    -- Create notifications for all members who want this type
    for member_record in
      select sbm.user_id, sbm.notification_preferences
      from shared_budget_members sbm
      where sbm.budget_id = NEW.budget_id
      and (sbm.notification_preferences->notification_type)::boolean = true
    loop
      insert into budget_notifications (
        budget_id,
        user_id,
        type,
        message,
        data
      ) values (
        NEW.budget_id,
        member_record.user_id,
        notification_type,
        notification_message,
        notification_data
      );
    end loop;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger budget_progress_notification_trigger
after insert or update on budget_progress
for each row
execute function notify_budget_members();

-- Indexes for performance
create index idx_shared_budget_members_budget_id on shared_budget_members(budget_id);
create index idx_shared_budget_members_user_id on shared_budget_members(user_id);
create index idx_budget_progress_budget_id on budget_progress(budget_id);
create index idx_budget_progress_category_id on budget_progress(category_id);
create index idx_budget_notifications_user_id on budget_notifications(user_id);
create index idx_budget_notifications_budget_id on budget_notifications(budget_id);

-- Update trigger for updated_at
create trigger set_shared_budget_members_updated_at
before update on shared_budget_members
for each row
execute function set_updated_at();

create trigger set_budget_progress_updated_at
before update on budget_progress
for each row
execute function set_updated_at();

create trigger set_budget_notifications_updated_at
before update on budget_notifications
for each row
execute function set_updated_at();
