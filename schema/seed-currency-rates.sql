-- Seed currency rates table with initial data
INSERT INTO currency_rates (
  base_currency,
  target_currency,
  rate,
  as_of_date
)
VALUES
  -- USD to other currencies
  ('USD', 'EUR', 0.92, CURRENT_DATE),
  ('USD', 'GBP', 0.79, CURRENT_DATE),
  ('USD', 'JPY', 150.23, CURRENT_DATE),
  ('USD', 'CAD', 1.36, CURRENT_DATE),
  ('USD', 'AUD', 1.52, CURRENT_DATE),
  ('USD', 'CNY', 7.24, CURRENT_DATE),
  ('USD', 'INR', 83.12, CURRENT_DATE),
  ('USD', 'BRL', 5.05, CURRENT_DATE),
  ('USD', 'MXN', 16.73, CURRENT_DATE),
  ('USD', 'SGD', 1.34, CURRENT_DATE),
  
  -- EUR to other currencies
  ('EUR', 'USD', 1.09, CURRENT_DATE),
  ('EUR', 'GBP', 0.86, CURRENT_DATE),
  ('EUR', 'JPY', 163.51, CURRENT_DATE),
  ('EUR', 'CAD', 1.48, CURRENT_DATE),
  ('EUR', 'AUD', 1.65, CURRENT_DATE),
  
  -- GBP to other currencies
  ('GBP', 'USD', 1.27, CURRENT_DATE),
  ('GBP', 'EUR', 1.16, CURRENT_DATE),
  ('GBP', 'JPY', 190.16, CURRENT_DATE),
  ('GBP', 'CAD', 1.72, CURRENT_DATE),
  ('GBP', 'AUD', 1.92, CURRENT_DATE)
ON CONFLICT (base_currency, target_currency, as_of_date) DO UPDATE
SET rate = EXCLUDED.rate;

