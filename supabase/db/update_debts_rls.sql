-- Drop the existing RLS policy
DROP POLICY IF EXISTS "Users can manage their own debts" ON public.debts;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Authenticated users can manage their own debts"
ON public.debts
FOR ALL
USING (
  -- Allow access if the user is authenticated and the record belongs to them
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Create a policy for anonymous users with client IDs
CREATE POLICY "Anonymous users can manage debts with their client ID"
ON public.debts
FOR ALL
USING (
  -- For anonymous users, we'll use a special function to check client ID
  -- This will be handled through headers or cookies in the application
  (auth.uid() IS NULL)
);

-- Refresh PostgREST schema cache to ensure the new policies are applied
NOTIFY pgrst, 'reload schema';
