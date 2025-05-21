'use server';

import { createSubscription } from '@/app/actions/subscription';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from '@/types/subscription';

// Server action to handle form submission - save directly to database only
export async function createSubscriptionAction(formData: any) {
  try {
    // Log the received form data for debugging
    console.log('Received form data in server action:', formData);
    
    // Call the database setup endpoint to ensure database is properly configured
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/database/subscription-setup`, {
      cache: 'no-store'
    }).catch(err => console.error('Setup endpoint error:', err));
    
    // Make sure next_renewal_date is properly formatted
    let formattedData = { ...formData };
    
    // Check if next_renewal_date exists and is a Date object
    if (formData.next_renewal_date) {
      if (formData.next_renewal_date instanceof Date) {
        formattedData.next_renewal_date = formData.next_renewal_date.toISOString().split('T')[0];
      } else if (typeof formData.next_renewal_date === 'string') {
        // If it's already a string, make sure it's in the right format
        const dateObj = new Date(formData.next_renewal_date);
        formattedData.next_renewal_date = dateObj.toISOString().split('T')[0];
      }
    }
    
    // Create the subscription directly in the database
    const subscription = await createSubscription(formattedData);
    
    // We successfully created the subscription in the database
    return { success: true, redirectTo: '/subscriptions', subscription };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return { success: false, error: error.message };
  }
}
