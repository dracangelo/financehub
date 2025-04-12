-- USERS
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default current_timestamp
);

-- TAX PROFILES
create table tax_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  filing_status text check (filing_status in ('single', 'married_joint', 'married_separate', 'head_of_household')),
  dependents integer check (dependents >= 0),
  state text not null,
  country text not null default 'USA',
  created_at timestamptz default current_timestamp
);

create index on tax_profiles(user_id);

-- TAX OPTIMIZATION TIPS
create table tax_optimization_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tip text not null,
  category text not null,
  impact_estimate numeric(12, 2),
  is_implemented boolean default false,
  created_at timestamptz default current_timestamp
);

create index on tax_optimization_tips(user_id);

-- TAX-ADVANTAGED ACCOUNTS
create table tax_advantaged_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_type text check (account_type in ('401k', 'IRA', 'HSA', '529', 'Roth IRA', 'SEP IRA', 'FSA')),
  reason text,
  estimated_tax_savings numeric(12, 2),
  recommended_contribution numeric(12, 2),
  created_at timestamptz default current_timestamp
);

create index on tax_advantaged_accounts(user_id);

-- TAX DEDUCTIONS
create table tax_deductions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deduction_name text not null,
  category text not null,
  eligible boolean default false,
  estimated_savings numeric(12, 2),
  notes text,
  created_at timestamptz default current_timestamp
);

create index on tax_deductions(user_id);

-- TAX DOCUMENTS
create table tax_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  document_type text not null,
  uploaded_at timestamptz default current_timestamp,
  tags text[]
);

create index on tax_documents(user_id);

-- TAX IMPACT PREDICTIONS
create table tax_impact_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  decision_type text not null,
  description text,
  estimated_tax_impact numeric(12, 2),
  notes text,
  created_at timestamptz default current_timestamp
);

create index on tax_impact_predictions(user_id);

-- TAX PROFESSIONAL INTEGRATION
create table tax_pro_invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pro_email text not null,
  access_level text check (access_level in ('view', 'edit')) not null,
  token text unique not null,
  is_active boolean default true,
  created_at timestamptz default current_timestamp
);

create index on tax_pro_invitations(user_id);

-- YEARLY TAX DATA
create table tax_yearly_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tax_year integer not null,
  total_income numeric(12, 2),
  total_deductions numeric(12, 2),
  taxable_income numeric(12, 2),
  total_tax_paid numeric(12, 2),
  refund_or_due numeric(12, 2),
  created_at timestamptz default current_timestamp
);

create index on tax_yearly_data(user_id, tax_year);

-- TAX BURDEN ANALYSIS
create table tax_burden_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  year integer not null,
  income_type text not null,
  amount numeric(12, 2),
  tax_paid numeric(12, 2)
);

create index on tax_burden_analysis(user_id, year);

-- DEDUCTION OPPORTUNITY MAP
create table deduction_opportunity_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  eligible_amount numeric(12, 2),
  claimed_amount numeric(12, 2),
  potential_savings numeric(12, 2),
  year integer not null
);

create index on deduction_opportunity_map(user_id, year);
