-- Add an INSERT policy to notification_preferences table
CREATE POLICY notification_preferences_insert_policy ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a trigger function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default notification preferences for the new user
  INSERT INTO public.notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    watchlist_alerts,
    budget_alerts,
    expense_reminders,
    bill_reminders,
    investment_updates
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger already exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
