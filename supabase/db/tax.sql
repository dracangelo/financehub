-- ========================================
-- INTEGRATED TAX PLANNING & PREPARATION
-- ========================================

-- Tax Optimization Recommendations
create table if not exists tax_optimization_recommendations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    recommendation_type text not null check (recommendation_type in ('year-round', 'transactional')),
    recommendation_text text not null,
    is_implemented boolean default false,
    implemented_at timestamptz,
    created_at timestamptz default now()
);

-- Tax-Advantaged Account Recommendations (e.g., IRAs, 401(k)s)
create table if not exists tax_advantaged_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    account_type text not null check (account_type in ('IRA', '401k', 'HSA', 'Other')),
    recommended_contribution numeric not null,
    suggested_tax_impact numeric not null,
    is_implemented boolean default false,
    implemented_at timestamptz,
    created_at timestamptz default now()
);

-- Deduction Finder (Automatic Detection of Deductible Expenses)
create table if not exists deduction_finder (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    expense_category text not null,
    potential_deduction numeric not null,
    is_claimed boolean default false,
    claimed_at timestamptz,
    created_at timestamptz default now()
);

-- Tax Document Organization System (For Tax Season Readiness)
create table if not exists tax_documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    document_name text not null,
    document_type text not null check (document_type in ('W2', '1099', 'Receipts', 'Other')),
    document_url text,
    is_uploaded boolean default false,
    uploaded_at timestamptz,
    created_at timestamptz default now()
);

-- Tax Impact Predictions (For Major Financial Decisions)
create table if not exists tax_impact_predictions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    financial_decision text not null,
    estimated_tax_impact numeric not null,
    prediction_date timestamptz,
    created_at timestamptz default now()
);

-- Tax Professional Integration (Seamless Handoff for Tax Filing)
create table if not exists tax_professional_integrations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    professional_name text not null,
    contact_info jsonb,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- Tax Filing Tracker (To Track Filing Progress)
create table if not exists tax_filing_tracker (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    filing_year int not null,
    filing_status text not null check (filing_status in ('in_progress', 'submitted', 'approved', 'rejected')),
    filed_at timestamptz,
    created_at timestamptz default now()
);

-- Tax Report Generation (For Simplified Filing)
create table if not exists tax_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    report_year int not null,
    report_url text not null,
    is_generated boolean default false,
    generated_at timestamptz,
    created_at timestamptz default now()
);

-- ========================================
-- INTEGRATION WITH DEBT AND INCOME
-- ========================================

-- Adding tax impact on debt payments (Mortgage, Interest)
create table if not exists debt_tax_impact (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    debt_type text not null check (debt_type in ('mortgage', 'credit_card', 'student_loan', 'auto_loan', 'other')),
    interest_paid numeric not null,
    potential_tax_deduction numeric not null, -- Based on the debt type and interest rates
    created_at timestamptz default now()
);

-- Track user's income sources for tax calculations (employment, freelance, etc.)
create table if not exists income_tax_impact (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    income_type text not null check (income_type in ('salary', 'freelance', 'investment', 'side_hustle', 'pension', 'other')),
    income_amount numeric not null,
    estimated_tax_impact numeric not null, -- Tax impact based on income type and applicable tax brackets
    created_at timestamptz default now()
);

-- ========================================
-- INTEGRATED VIEWS FOR TAX CALCULATION AND PLANNING
-- ========================================

-- View to summarize total debt-related tax impact
create or replace view debt_tax_impact_summary as
select 
    d.user_id,
    sum(d.interest_paid) as total_interest_paid,
    sum(d.potential_tax_deduction) as total_tax_deduction
from debt_tax_impact d
group by d.user_id;

-- View to summarize total income-related tax impact
create or replace view income_tax_impact_summary as
select 
    i.user_id,
    sum(i.income_amount) as total_income,
    sum(i.estimated_tax_impact) as total_tax_impact
from income_tax_impact i
group by i.user_id;

-- View to integrate tax savings opportunities from both debt and income
create or replace view total_tax_optimization_summary as
select 
    t.user_id,
    coalesce(sum(d.potential_tax_deduction), 0) as debt_tax_savings,
    coalesce(sum(i.estimated_tax_impact), 0) as income_tax_savings,
    coalesce(sum(d.potential_tax_deduction), 0) + coalesce(sum(i.estimated_tax_impact), 0) as total_tax_savings
from tax_optimization_recommendations t
left join debt_tax_impact d on t.user_id = d.user_id
left join income_tax_impact i on t.user_id = i.user_id
group by t.user_id;

-- ========================================
-- END OF INTEGRATION WITH DEBT AND INCOME
-- ========================================
