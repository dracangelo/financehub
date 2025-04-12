-- Remove the user reference and add name field
alter table expense_splits drop column shared_with;
alter table expense_splits add column shared_with_name text not null;
