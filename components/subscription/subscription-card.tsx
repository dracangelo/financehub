'use client';

import { Subscription } from '@/types/subscription';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Edit, ExternalLink, Trash } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionCategoryInfo } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Format the recurring amount
  const formattedAmount = formatCurrency(subscription.amount, subscription.currency);
  
  // Get the recurrence text
  const getRecurrenceText = () => {
    switch (subscription.recurrence) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
      case 'annual':
        return 'Yearly';
      case 'weekly':
        return 'Weekly';
      case 'quarterly':
        return 'Quarterly';
      case 'semi_annual':
        return 'Biannually';
      case 'bi_weekly':
        return 'Bi-Weekly';
      case 'daily':
        return 'Daily';
      default:
        return subscription.recurrence;
    }
  };

  // Handle edit click
  const handleEdit = () => {
    router.push(`/subscriptions/${subscription.id}`);
  };

  // Handle delete click
  const handleDelete = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Delete from database
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }
      
      toast.success('Subscription deleted successfully');
      
      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{subscription.name}</CardTitle>
        </div>
        {subscription.service_provider && (
          <p className="text-sm text-muted-foreground">{subscription.service_provider}</p>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div className="flex items-center text-lg font-semibold">
            <DollarSign className="h-5 w-5 mr-1 text-primary" />
            {formattedAmount}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{getRecurrenceText()}</span>
          </div>
          
          {subscription.category && (
            <Badge variant="secondary" className="mt-2">
              {typeof subscription.category === 'string' ? subscription.category : subscription.category.name}
            </Badge>
          )}
          
          {subscription.description && (
            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
              {subscription.description}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </CardFooter>
    </Card>
  );
}
