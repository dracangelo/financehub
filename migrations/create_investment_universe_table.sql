-- Create investment_universe table for ESG screener and watchlist features
CREATE TABLE IF NOT EXISTS public.investment_universe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  sector_id TEXT,
  industry TEXT,
  market_cap DECIMAL(20, 2),
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  dividend_yield DECIMAL(6, 2),
  pe_ratio DECIMAL(10, 2),
  esg_score JSONB DEFAULT '{"environmental": 0, "social": 0, "governance": 0, "total": 0}'::jsonb,
  esg_categories TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by ticker
CREATE INDEX IF NOT EXISTS investment_universe_ticker_idx ON public.investment_universe(ticker);

-- Create index for sector searches
CREATE INDEX IF NOT EXISTS investment_universe_sector_idx ON public.investment_universe(sector_id);

-- Insert sample data for the investment universe
INSERT INTO public.investment_universe 
  (ticker, name, sector_id, industry, market_cap, price, dividend_yield, pe_ratio, esg_score, esg_categories, description)
VALUES
  ('AAPL', 'Apple Inc.', 'technology', 'Consumer Electronics', 2850000000000, 175.42, 0.55, 28.91, '{"environmental": 8.2, "social": 7.5, "governance": 8.8, "total": 8.2}'::jsonb, '{"climate_action","supply_chain_management","privacy"}', 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.'),
  
  ('MSFT', 'Microsoft Corporation', 'technology', 'Software', 2780000000000, 410.75, 0.72, 37.42, '{"environmental": 8.5, "social": 7.8, "governance": 9.0, "total": 8.4}'::jsonb, '{"climate_action","digital_inclusion","privacy"}', 'Develops, licenses, and supports software, services, devices, and solutions worldwide.'),
  
  ('GOOGL', 'Alphabet Inc.', 'communication_services', 'Internet Content & Information', 1850000000000, 156.28, 0.51, 25.18, '{"environmental": 7.8, "social": 6.5, "governance": 7.2, "total": 7.2}'::jsonb, '{"digital_inclusion","privacy","ethical_ai"}', 'Provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.'),
  
  ('AMZN', 'Amazon.com, Inc.', 'consumer_cyclical', 'Internet Retail', 1750000000000, 185.07, 0, 60.35, '{"environmental": 6.2, "social": 5.5, "governance": 7.0, "total": 6.2}'::jsonb, '{"climate_action","supply_chain_management","labor_practices"}', 'Engages in the retail sale of consumer products and subscriptions in North America and internationally.'),
  
  ('TSLA', 'Tesla, Inc.', 'consumer_cyclical', 'Auto Manufacturers', 570000000000, 182.63, 0, 50.73, '{"environmental": 9.5, "social": 5.8, "governance": 6.2, "total": 7.2}'::jsonb, '{"climate_action","clean_energy","sustainable_transportation"}', 'Designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems.'),
  
  ('NVDA', 'NVIDIA Corporation', 'technology', 'Semiconductors', 2250000000000, 920.35, 0.03, 68.17, '{"environmental": 7.5, "social": 7.0, "governance": 8.0, "total": 7.5}'::jsonb, '{"ethical_ai","energy_efficiency","supply_chain_management"}', 'Operates as a visual computing company worldwide, offering GPUs for gaming and professional markets.'),
  
  ('JNJ', 'Johnson & Johnson', 'healthcare', 'Drug Manufacturers', 380000000000, 147.52, 3.12, 15.82, '{"environmental": 7.0, "social": 8.5, "governance": 8.2, "total": 7.9}'::jsonb, '{"healthcare_access","product_safety","ethical_business"}', 'Researches, develops, manufactures, and sells various products in the health care field worldwide.'),
  
  ('PG', 'The Procter & Gamble Company', 'consumer_defensive', 'Household & Personal Products', 350000000000, 165.38, 2.31, 28.51, '{"environmental": 7.8, "social": 8.0, "governance": 8.5, "total": 8.1}'::jsonb, '{"water_conservation","sustainable_packaging","supply_chain_management"}', 'Provides branded consumer packaged goods worldwide.'),
  
  ('V', 'Visa Inc.', 'financial_services', 'Credit Services', 520000000000, 278.57, 0.73, 31.45, '{"environmental": 7.2, "social": 7.5, "governance": 8.8, "total": 7.8}'::jsonb, '{"financial_inclusion","data_security","ethical_business"}', 'Operates as a payments technology company worldwide.'),
  
  ('MA', 'Mastercard Incorporated', 'financial_services', 'Credit Services', 430000000000, 455.82, 0.58, 36.91, '{"environmental": 7.0, "social": 7.8, "governance": 8.5, "total": 7.8}'::jsonb, '{"financial_inclusion","data_security","ethical_business"}', 'Provides transaction processing and other payment-related products and services worldwide.'),
  
  ('HD', 'The Home Depot, Inc.', 'consumer_cyclical', 'Home Improvement Retail', 350000000000, 342.87, 2.48, 22.85, '{"environmental": 6.8, "social": 7.0, "governance": 7.5, "total": 7.1}'::jsonb, '{"sustainable_forestry","energy_efficiency","labor_practices"}', 'Operates home improvement retail stores.'),
  
  ('DIS', 'The Walt Disney Company', 'communication_services', 'Entertainment', 180000000000, 114.01, 0, 68.28, '{"environmental": 7.5, "social": 8.0, "governance": 7.8, "total": 7.8}'::jsonb, '{"diversity_inclusion","content_responsibility","environmental_impact"}', 'Operates as an entertainment company worldwide.'),
  
  ('KO', 'The Coca-Cola Company', 'consumer_defensive', 'Beverages—Non-Alcoholic', 290000000000, 61.23, 2.75, 26.16, '{"environmental": 6.5, "social": 7.2, "governance": 8.0, "total": 7.2}'::jsonb, '{"water_conservation","sustainable_packaging","nutrition"}', 'Manufactures, markets, and sells various nonalcoholic beverages worldwide.'),
  
  ('PEP', 'PepsiCo, Inc.', 'consumer_defensive', 'Beverages—Non-Alcoholic', 250000000000, 174.13, 2.73, 26.38, '{"environmental": 6.8, "social": 7.0, "governance": 7.8, "total": 7.2}'::jsonb, '{"water_conservation","sustainable_agriculture","nutrition"}', 'Manufactures, markets, distributes, and sells beverages and convenient foods worldwide.'),
  
  ('NFLX', 'Netflix, Inc.', 'communication_services', 'Entertainment', 240000000000, 628.31, 0, 52.36, '{"environmental": 6.5, "social": 7.0, "governance": 7.2, "total": 6.9}'::jsonb, '{"content_responsibility","diversity_inclusion","data_privacy"}', 'Provides entertainment services worldwide.'),
  
  ('ADBE', 'Adobe Inc.', 'technology', 'Software', 230000000000, 474.05, 0, 45.58, '{"environmental": 7.8, "social": 7.5, "governance": 8.2, "total": 7.8}'::jsonb, '{"digital_inclusion","privacy","ethical_ai"}', 'Operates as a diversified software company worldwide.'),
  
  ('CRM', 'Salesforce, Inc.', 'technology', 'Software', 270000000000, 273.66, 0, 63.87, '{"environmental": 8.0, "social": 8.5, "governance": 8.0, "total": 8.2}'::jsonb, '{"climate_action","digital_inclusion","ethical_business"}', 'Provides customer relationship management technology that brings companies and customers together worldwide.'),
  
  ('COST', 'Costco Wholesale Corporation', 'consumer_defensive', 'Discount Stores', 310000000000, 731.31, 0.59, 49.61, '{"environmental": 7.0, "social": 8.0, "governance": 7.5, "total": 7.5}'::jsonb, '{"sustainable_sourcing","labor_practices","food_waste_reduction"}', 'Engages in the operation of membership warehouses worldwide.'),
  
  ('WMT', 'Walmart Inc.', 'consumer_defensive', 'Discount Stores', 410000000000, 59.91, 1.45, 31.37, '{"environmental": 6.5, "social": 7.0, "governance": 7.2, "total": 6.9}'::jsonb, '{"sustainable_sourcing","labor_practices","food_waste_reduction"}', 'Engages in retail and wholesale operations worldwide.'),
  
  ('INTC', 'Intel Corporation', 'technology', 'Semiconductors', 120000000000, 30.18, 1.46, 15.09, '{"environmental": 8.0, "social": 7.2, "governance": 7.5, "total": 7.6}'::jsonb, '{"energy_efficiency","supply_chain_management","ethical_ai"}', 'Designs, manufactures, and sells essential technologies for the cloud, smart, and connected devices worldwide.');
