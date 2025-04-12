-- Insert default categories
INSERT INTO categories (id, user_id, name, color, icon, is_income)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Salary', '#10b981', 'dollar-sign', true),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Bonus', '#3b82f6', 'gift', true),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Interest', '#6366f1', 'trending-up', true),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Dividends', '#8b5cf6', 'pie-chart', true),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Gifts', '#ec4899', 'gift', true),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'Housing', '#ef4444', 'home', false),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'Utilities', '#f59e0b', 'zap', false),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'Groceries', '#10b981', 'shopping-cart', false),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'Dining Out', '#3b82f6', 'coffee', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'Transportation', '#6366f1', 'car', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'Healthcare', '#8b5cf6', 'activity', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'Entertainment', '#ec4899', 'film', false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'Shopping', '#f59e0b', 'shopping-bag', false),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000', 'Travel', '#10b981', 'plane', false),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000', 'Education', '#3b82f6', 'book', false);

-- Insert default accounts
INSERT INTO accounts (id, user_id, name, type, balance, currency, institution, color, icon)
VALUES
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000000', 'Checking Account', 'checking', 5000.00, 'USD', 'Bank of America', '#10b981', 'credit-card'),
  ('22222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000000', 'Savings Account', 'savings', 10000.00, 'USD', 'Bank of America', '#3b82f6', 'piggy-bank'),
  ('33333333-3333-3333-3333-333333333334', '00000000-0000-0000-0000-000000000000', 'Credit Card', 'credit_card', -1500.00, 'USD', 'Chase', '#ef4444', 'credit-card'),
  ('44444444-4444-4444-4444-444444444445', '00000000-0000-0000-0000-000000000000', 'Investment Account', 'investment', 25000.00, 'USD', 'Vanguard', '#8b5cf6', 'trending-up'),
  ('55555555-5555-5555-5555-555555555556', '00000000-0000-0000-0000-000000000000', 'Cash', 'cash', 200.00, 'USD', NULL, '#f59e0b', 'dollar-sign');

-- Insert sample transactions
INSERT INTO transactions (id, user_id, account_id, category_id, amount, description, is_income, date)
VALUES
  ('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 3000.00, 'Monthly Salary', true, CURRENT_DATE - INTERVAL '30 days'),
  ('22222222-2222-2222-2222-222222222224', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', '66666666-6666-6666-6666-666666666666', 1200.00, 'Rent Payment', false, CURRENT_DATE - INTERVAL '28 days'),
  ('33333333-3333-3333-3333-333333333335', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', '77777777-7777-7777-7777-777777777777', 150.00, 'Electricity Bill', false, CURRENT_DATE - INTERVAL '25 days'),
  ('44444444-4444-4444-4444-444444444446', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', '88888888-8888-8888-8888-888888888888', 85.00, 'Grocery Shopping', false, CURRENT_DATE - INTERVAL '20 days'),
  ('55555555-5555-5555-5555-555555555557', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333334', '99999999-9999-9999-9999-999999999999', 45.00, 'Dinner at Restaurant', false, CURRENT_DATE - INTERVAL '15 days'),
  ('66666666-6666-6666-6666-666666666667', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333334', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 30.00, 'Gas Station', false, CURRENT_DATE - INTERVAL '10 days'),
  ('77777777-7777-7777-7777-777777777778', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', 25.00, 'Savings Interest', true, CURRENT_DATE - INTERVAL '5 days'),
  ('88888888-8888-8888-8888-888888888889', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 3000.00, 'Monthly Salary', true, CURRENT_DATE - INTERVAL '1 day'),
  ('99999999-9999-9999-9999-99999999999a', '00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555556', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 120.00, 'New Clothes', false, CURRENT_DATE);

-- Insert sample budgets
INSERT INTO budgets (id, user_id, category_id, amount, period, start_date)
VALUES
  ('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 1500.00, 'monthly', CURRENT_DATE - INTERVAL '30 days'),
  ('22222222-2222-2222-2222-222222222225', '00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 400.00, 'monthly', CURRENT_DATE - INTERVAL '30 days'),
  ('33333333-3333-3333-3333-333333333336', '00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 200.00, 'monthly', CURRENT_DATE - INTERVAL '30 days'),
  ('44444444-4444-4444-4444-444444444447', '00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 150.00, 'monthly', CURRENT_DATE - INTERVAL '30 days'),
  ('55555555-5555-5555-5555-555555555558', '00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 100.00, 'monthly', CURRENT_DATE - INTERVAL '30 days');

