import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getSubscriptionById, 
  getSubscriptionCategories,
  getSubscriptionUsageLogs,
  getSubscriptionPriceChanges
} from '@/app/actions/subscription';
import SubscriptionDetail from '@/components/subscription/subscription-detail';

export const metadata: Metadata = {
  title: 'Subscription Details | FinanceHub',
  description: 'View and manage your subscription details',
};

interface SubscriptionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { id } = params;
  
  // Fetch subscription data
  const subscription = await getSubscriptionById(id);
  
  if (!subscription) {
    notFound();
  }
  
  // Fetch additional data in parallel
  const [categories, usageLogs, priceChanges] = await Promise.all([
    getSubscriptionCategories(),
    getSubscriptionUsageLogs(id),
    getSubscriptionPriceChanges(id),
  ]);
  
  // Find the category for this subscription
  const category = subscription.category_id 
    ? categories.find(cat => cat.id === subscription.category_id) 
    : null;
  
  return (
    <div className="container py-6">
      <SubscriptionDetail 
        subscription={subscription}
        category={category}
        usageLogs={usageLogs}
        priceChanges={priceChanges}
      />
    </div>
  );
}
