-- Insert sectors
INSERT INTO sectors (id, name, description, can_exclude) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Technology', 'Technology companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Healthcare', 'Healthcare companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Financial Services', 'Financial services companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Consumer Goods', 'Consumer goods companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'Energy', 'Energy companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'Utilities', 'Utility companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'Real Estate', 'Real estate companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'Industrials', 'Industrial companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'Materials', 'Materials companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'Telecommunications', 'Telecommunications companies', false),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d489', 'Fossil Fuels', 'Fossil fuel companies', true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d490', 'Weapons', 'Weapons and defense companies', true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d491', 'Tobacco', 'Tobacco companies', true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d492', 'Gambling', 'Gambling companies', true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d493', 'Adult Entertainment', 'Adult entertainment companies', true),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d494', 'Alcohol', 'Alcohol companies', true);

-- Insert ESG categories
INSERT INTO esg_categories (id, name, category_type, description) VALUES
  ('e47ac10b-58cc-4372-a567-0e02b2c3d479', 'Climate Action', 'environmental', 'Efforts to combat climate change'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d480', 'Pollution & Waste', 'environmental', 'Management of pollution and waste'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d481', 'Water Management', 'environmental', 'Water conservation and management'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d482', 'Biodiversity', 'environmental', 'Protection of biodiversity'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d483', 'Labor Rights', 'social', 'Fair labor practices and rights'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d484', 'Diversity & Inclusion', 'social', 'Diversity and inclusion initiatives'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d485', 'Community Relations', 'social', 'Engagement with local communities'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d486', 'Data Privacy & Security', 'social', 'Protection of data privacy'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d487', 'Board Composition', 'governance', 'Diversity and independence of board'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d488', 'Executive Compensation', 'governance', 'Fair executive compensation'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d489', 'Business Ethics', 'governance', 'Ethical business practices'),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d490', 'Transparency', 'governance', 'Transparency in reporting and operations');

