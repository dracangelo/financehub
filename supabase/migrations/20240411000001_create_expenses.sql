-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_merchant_id ON expenses(merchant_id);
CREATE INDEX idx_expenses_spent_at ON expenses(spent_at);
CREATE INDEX idx_expenses_is_recurring ON expenses(is_recurring);
