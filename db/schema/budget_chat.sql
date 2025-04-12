-- Budget Chat Messages
create table budget_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Budget Chat Reactions
create table budget_chat_reactions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references budget_chat_messages(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  reaction text not null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(message_id, user_id, reaction)
);

-- Budget Chat Mentions
create table budget_chat_mentions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references budget_chat_messages(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  mentioned_user_id uuid references users(id) on delete cascade,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Budget Chat Attachments
create table budget_chat_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references budget_chat_messages(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  file_url text not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Indexes for performance
create index idx_budget_chat_messages_budget_id on budget_chat_messages(budget_id);
create index idx_budget_chat_messages_user_id on budget_chat_messages(user_id);
create index idx_budget_chat_reactions_message_id on budget_chat_reactions(message_id);
create index idx_budget_chat_mentions_message_id on budget_chat_mentions(message_id);
create index idx_budget_chat_mentions_mentioned_user_id on budget_chat_mentions(mentioned_user_id);

-- Update triggers
create trigger set_budget_chat_messages_updated_at
before update on budget_chat_messages
for each row
execute function set_updated_at();

create trigger set_budget_chat_reactions_updated_at
before update on budget_chat_reactions
for each row
execute function set_updated_at();

create trigger set_budget_chat_mentions_updated_at
before update on budget_chat_mentions
for each row
execute function set_updated_at();

create trigger set_budget_chat_attachments_updated_at
before update on budget_chat_attachments
for each row
execute function set_updated_at();

-- Function to notify mentioned users
create or replace function notify_mentioned_users()
returns trigger as $$
declare
  mentioned_user record;
begin
  for mentioned_user in
    select mentioned_user_id
    from budget_chat_mentions
    where message_id = NEW.id
  loop
    insert into budget_notifications (
      budget_id,
      user_id,
      type,
      message,
      data
    ) values (
      NEW.budget_id,
      mentioned_user.mentioned_user_id,
      'mention',
      format('You were mentioned in a budget discussion by %s', NEW.user_id),
      jsonb_build_object(
        'message_id', NEW.id,
        'message_content', NEW.content,
        'mentioned_by', NEW.user_id
      )
    );
  end loop;
  return NEW;
end;
$$ language plpgsql;

create trigger budget_chat_mention_notification_trigger
after insert on budget_chat_messages
for each row
execute function notify_mentioned_users();
