
-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamp default now()
);

-- BILLERS / SERVICE PROVIDERS
create table billers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text check (category in ('utilities', 'streaming', 'insurance', 'software', 'telecom', 'entertainment', 'education', 'healthcare', 'fitness', 'food_delivery', 'cloud_storage', 'security', 'other')),
  website_url text,
  support_contact text,
  created_at timestamp default now()
);

-- USER SUBSCRIPTIONS / BILLS
create table user_bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  biller_id uuid references billers(id),
  name text not null, -- e.g., Netflix, AT&T Internet
  type text check (type in ('subscription', 'utility', 'loan', 'other')) default 'subscription',
  amount numeric not null,
  billing_frequency text check (billing_frequency in ('monthly', 'quarterly', 'yearly', 'weekly')) default 'monthly',
  next_payment_date date,
  payment_method text, -- card/bank/etc
  auto_pay boolean default false,
  start_date date,
  end_date date,
  is_active boolean default true,
  usage_value numeric, -- optional: track perceived value/ROI
  created_at timestamp default now()
);

-- SMART SCHEDULING & PAYMENTS
create table payment_schedule (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  scheduled_date date not null,
  optimized boolean default false, -- if rescheduled for cash flow
  status text check (status in ('pending', 'paid', 'partially_paid', 'unpaid', 'skipped', 'overdue')) default 'pending',
  actual_payment_date date,
  notes text,
  created_at timestamp default now()
);

-- BILL PRICE HISTORY (to track increases over time)
create table bill_price_history (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  effective_date date not null,
  previous_amount numeric,
  new_amount numeric,
  reason text, -- optional (e.g. plan change, provider rate hike)
  detected_by text check (detected_by in ('manual', 'system')),
  created_at timestamp default now()
);

-- USAGE TRACKING (for ROI calculations)
create table bill_usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  usage_metric text, -- e.g., "hours_streamed", "data_used", "calls made"
  value numeric,
  usage_date date default current_date,
  notes text
);

-- SUBSCRIPTION VALUE ASSESSMENT
create table subscription_roi (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  monthly_cost numeric,
  avg_monthly_usage numeric,
  perceived_value numeric, -- user rating
  roi_score numeric, -- calculated
  recommendation text, -- keep, review, cancel
  updated_at timestamp default now()
);

-- DUPLICATE SERVICE DETECTION
create table duplicate_services (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  service_name text,
  bill_ids uuid[], -- references overlapping user_bills
  detected_on timestamp default now(),
  resolution_status text check (resolution_status in ('unresolved', 'merged', 'canceled')) default 'unresolved'
);

-- ALERTS & NOTIFICATIONS
create table bill_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  user_bill_id uuid references user_bills(id),
  alert_type text check (alert_type in ('price_increase', 'low_value', 'duplication', 'missed_payment', 'upcoming_due')),
  alert_message text,
  triggered_on timestamp default now(),
  is_dismissed boolean default false
);

-- STATEMENT STORAGE
create table bill_documents (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  file_url text not null,
  file_type text,
  statement_month date,
  searchable_text text,
  warranty_expiry date,
  created_at timestamp default now()
);

-- CALENDAR INTEGRATION
create table calendar_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  user_bill_id uuid references user_bills(id),
  reminder_time timestamp,
  method text check (method in ('email', 'push', 'calendar_sync')),
  notes text,
  created_at timestamp default now()
);

-- BILL PAYMENTS
create table bill_payments (
  id uuid primary key default uuid_generate_v4(),
  user_bill_id uuid references user_bills(id) on delete cascade,
  payment_schedule_id uuid references payment_schedule(id),
  amount_paid numeric not null,
  payment_date timestamp default now(),
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other')),
  payment_status text check (payment_status in ('completed', 'pending', 'failed')) default 'pending',
  transaction_reference text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
