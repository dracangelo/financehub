import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSubscription } from '@/app/actions/subscription';
import SubscriptionForm from '@/components/subscription/subscription-form';

export const metadata: Metadata = {
  title: 'Add Subscription | FinanceHub',
  description: 'Add a new subscription to track',
};

export default function NewSubscriptionPage() {
  // Server action to handle form submission
  async function handleCreateSubscription(formData: any) {
    'use server';
    
    await createSubscription({
      ...formData,
      next_renewal_date: formData.next_renewal_date.toISOString().split('T')[0],
    });
    
    redirect('/subscriptions');
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Subscription</h1>
        <p className="text-muted-foreground">
          Track your recurring subscriptions and never miss a payment
        </p>
      </div>
      
      <div className="max-w-2xl">
        <SubscriptionForm 
          onSubmit={handleCreateSubscription}
          isSubmitting={false}
        />
      </div>
    </div>
  );
}
