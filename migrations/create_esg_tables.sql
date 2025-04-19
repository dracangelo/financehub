-- Create ESG categories table
CREATE TABLE IF NOT EXISTS public.esg_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create excluded sectors table
CREATE TABLE IF NOT EXISTS public.excluded_sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample ESG categories
INSERT INTO public.esg_categories (id, name, category, description)
VALUES
  ('climate_action', 'Climate Action', 'environmental', 'Companies taking significant steps to reduce carbon emissions and combat climate change'),
  ('clean_energy', 'Clean Energy', 'environmental', 'Companies investing in or producing renewable and clean energy solutions'),
  ('water_conservation', 'Water Conservation', 'environmental', 'Companies with strong water management and conservation practices'),
  ('pollution_reduction', 'Pollution Reduction', 'environmental', 'Companies with effective pollution control and reduction strategies'),
  ('sustainable_packaging', 'Sustainable Packaging', 'environmental', 'Companies using or developing sustainable packaging solutions'),
  ('sustainable_agriculture', 'Sustainable Agriculture', 'environmental', 'Companies employing sustainable farming and agriculture practices'),
  ('biodiversity', 'Biodiversity Protection', 'environmental', 'Companies with programs to protect and enhance biodiversity'),
  ('circular_economy', 'Circular Economy', 'environmental', 'Companies adopting circular business models to reduce waste'),
  
  ('social_equity', 'Social Equity', 'social', 'Companies promoting fairness and equality in their operations and communities'),
  ('healthcare_access', 'Healthcare Access', 'social', 'Companies improving access to healthcare services and products'),
  ('human_rights', 'Human Rights', 'social', 'Companies with strong human rights policies and practices'),
  ('diversity_inclusion', 'Diversity & Inclusion', 'social', 'Companies with strong diversity and inclusion initiatives'),
  ('labor_practices', 'Fair Labor Practices', 'social', 'Companies with fair labor practices and worker protections'),
  ('community_investment', 'Community Investment', 'social', 'Companies investing in local communities and social development'),
  ('product_safety', 'Product Safety', 'social', 'Companies with exceptional product safety standards'),
  ('data_privacy', 'Data Privacy', 'social', 'Companies with strong data privacy protections for customers'),
  
  ('board_diversity', 'Board Diversity', 'governance', 'Companies with diverse board composition'),
  ('executive_compensation', 'Executive Compensation', 'governance', 'Companies with fair and transparent executive compensation practices'),
  ('transparency', 'Transparency', 'governance', 'Companies with high levels of transparency in reporting and operations'),
  ('ethical_business', 'Ethical Business Practices', 'governance', 'Companies demonstrating strong ethical business practices'),
  ('shareholder_rights', 'Shareholder Rights', 'governance', 'Companies respecting and protecting shareholder rights'),
  ('tax_transparency', 'Tax Transparency', 'governance', 'Companies with transparent tax practices and policies'),
  ('anti_corruption', 'Anti-Corruption', 'governance', 'Companies with strong anti-corruption policies and practices'),
  ('risk_management', 'Risk Management', 'governance', 'Companies with effective risk management frameworks');

-- Insert sample excluded sectors
INSERT INTO public.excluded_sectors (id, name, description)
VALUES
  ('fossil_fuels', 'Fossil Fuels', 'Companies primarily involved in the extraction, processing, or distribution of fossil fuels'),
  ('weapons', 'Weapons Manufacturing', 'Companies involved in the production of weapons and military equipment'),
  ('tobacco', 'Tobacco', 'Companies producing or distributing tobacco products'),
  ('gambling', 'Gambling', 'Companies primarily involved in gambling operations'),
  ('adult_entertainment', 'Adult Entertainment', 'Companies primarily involved in adult entertainment industry'),
  ('alcohol', 'Alcohol', 'Companies primarily producing alcoholic beverages'),
  ('nuclear', 'Nuclear Power', 'Companies involved in nuclear power generation'),
  ('animal_testing', 'Animal Testing', 'Companies conducting animal testing for non-medical purposes'),
  ('palm_oil', 'Unsustainable Palm Oil', 'Companies involved in unsustainable palm oil production'),
  ('gmos', 'GMOs', 'Companies primarily involved in genetically modified organisms');
