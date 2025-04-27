-- Migration: Add target_date column to goal_milestones table
-- This migration adds the target_date column to the goal_milestones table
-- to support milestone date tracking functionality

-- Add target_date column to goal_milestones table
ALTER TABLE IF EXISTS public.goal_milestones
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add comment for the new column
COMMENT ON COLUMN public.goal_milestones.target_date IS 'The target date for achieving this milestone';

-- Update existing milestones with null target_date
-- This ensures compatibility with existing data
UPDATE public.goal_milestones
SET target_date = NULL
WHERE target_date IS NULL;
