import { Metadata } from 'next';
import { getUserSubscriptions, getSubscriptionCategories } from '@/app/actions/subscription';
import SubscriptionList from '@/components/subscription/subscription-list';

export const metadata: Metadata = {
  title: 'Subscriptions | FinanceHub',
  description: 'Manage your recurring subscriptions and track their costs',
};

export default async function SubscriptionsPage() {
  // Fetch subscriptions and categories in parallel
  const [subscriptions, categories] = await Promise.all([
    getUserSubscriptions(),
    getSubscriptionCategories(),
  ]);

  return (
    <div className="container py-6">
      <SubscriptionList 
        subscriptions={subscriptions} 
        categories={categories} 
      />
    </div>
  );
}
