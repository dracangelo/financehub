"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, MapPinIcon, ReceiptIcon, SplitIcon, AlertTriangleIcon, CalendarDaysIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createExpense, updateExpense } from "@/app/actions/expenses";
import { uploadReceipt } from "@/lib/receipt-utils";
import { createSplitExpenseFromForm, getUsersForSplitExpense } from "@/lib/split-expense-utils";
import { Expense } from "@/types/expense";
import { Category } from "@/lib/constants/categories";

// Form schema
const expenseFormSchema = z.object({
  merchant_name: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  category_id: z.string({
    required_error: "Please select a category",
  }),
  description: z.string().min(1, "Description is required"),
  spent_at: z.date({
    required_error: "A date is required",
  }),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  is_recurring: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  receipt_image: z.any().optional().nullable(),
  warranty_expiry: z.date().optional().nullable(),
  split_with_name: z.string().optional().nullable(),
  split_amount: z.coerce.number().optional().nullable(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
type FieldValues = z.infer<typeof expenseFormSchema>;

interface ExtendedExpense extends Expense {
  merchant_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_impulse?: boolean;
  notes?: string;
  warranty_expiry?: string | null;
  split_with_name?: string;
  split_amount?: number | null;
  receipt_url?: string;
}

interface ExpenseFormProps {
  categories: Category[];
  expense?: ExtendedExpense;
  isEditing?: boolean;
  users?: { id: string; name: string }[];
  id?: string;
  name?: string;
}

export function ExpenseForm({ categories, expense, isEditing = false, users = [] }: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [availableUsers, setAvailableUsers] = useState(users);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      merchant_name: expense?.merchant_name || "",
      amount: expense?.amount || "",
      category_id: expense?.category || "",
      description: expense?.description || "",
      spent_at: expense?.spent_at ? new Date(expense.spent_at) : new Date(),
      latitude: expense?.latitude || undefined,
      longitude: expense?.longitude || undefined,
      is_recurring: expense?.is_recurring || false,
      notes: expense?.notes || "",
      receipt_image: undefined,
      warranty_expiry: expense?.warranty_expiry ? new Date(expense.warranty_expiry) : undefined,
      split_with_name: expense?.split_with_name || "",
      split_amount: expense?.split_amount || "",
    },
  });

  // Fetch users for split expense if not provided
  useEffect(() => {
    if (users.length === 0) {
      const fetchUsers = async () => {
        try {
          const userData = await getUsersForSplitExpense();
          setAvailableUsers(userData);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchUsers();
    }
  }, [users]);

  // Update form values when expense data changes (useful for editing)
  useEffect(() => {
    if (expense && isEditing) {
      form.reset({
        merchant_name: expense.merchant_name || expense.merchant?.name || "",
        amount: expense.amount || 0,
        category_id: expense.category || "",
        description: expense.description || "",
        spent_at: new Date(expense.spent_at),
        latitude: expense.latitude || null,
        longitude: expense.longitude || null,
        is_recurring: expense.is_recurring || false,
        is_impulse: expense.is_impulse || false,
        notes: expense.notes || "",
        receipt_image: null,
        warranty_expiry: expense.warranty_expiry ? new Date(expense.warranty_expiry) : null,
        split_with_name: expense.split_with_name || "",
        split_amount: expense.split_amount || null,
      });

      // Set location if available
      if (expense.latitude && expense.longitude) {
        setLocationEnabled(true);
      }

      // Set receipt preview if available
      if (expense.receipt_url) {
        setReceiptPreview(expense.receipt_url);
      }
    }
  }, [expense, isEditing, form]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          setLocationEnabled(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "Failed to get your location. Please try again.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  // Clear location
  const clearLocation = () => {
    form.setValue("latitude", null);
    form.setValue("longitude", null);
    setLocationEnabled(false);
  };

  // Handle receipt image selection
  const handleReceiptChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      
      reader.readAsDataURL(file);
      form.setValue("receipt_image", file);
    }
  };

  // Toggle split expense options
  const toggleSplitOptions = () => {
    setShowSplitOptions(!showSplitOptions);
    if (!showSplitOptions) {
      form.setValue("split_with_name", "");
      form.setValue("split_amount", null);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare form data
      const expenseData = {
        merchant_name: data.merchant_name,
        amount: Number(data.amount),
        category_id: data.category_id,
        description: data.description,
        spent_at: data.spent_at,
        location: data.latitude && data.longitude
          ? { latitude: Number(data.latitude), longitude: Number(data.longitude) }
          : null,
        is_recurring: data.is_recurring,
        is_impulse: data.is_impulse,
        notes: data.notes,
        warranty_expiry: data.warranty_expiry,
        split_with_name: data.split_with_name,
        split_amount: data.split_amount ? Number(data.split_amount) : null,
      };

      // Upload receipt if provided
      if (data.receipt_image) {
        try {
          const receiptUrl = await uploadReceipt(data.receipt_image);
          expenseData.receipt_url = receiptUrl;
        } catch (error) {
          console.error("Error uploading receipt:", error);
          toast({
            title: "Warning",
            description: "Failed to upload receipt, but continuing with expense creation.",
            variant: "default",
          });
        }
      }

      // Handle split expense
      if (data.split_with_name && data.split_amount) {
        try {
          await createSplitExpenseFromForm(expenseData);
          toast({
            title: "Split Expense Created",
            description: `Successfully created split expense with ${data.split_with_name}`,
            variant: "default",
          });
        } catch (error) {
          console.error("Error creating split expense:", error);
          toast({
            title: "Warning",
            description: "Failed to create split expense record, but continuing with main expense creation.",
            variant: "default",
          });
        }
      }
      
      // Submit the expense
      if (isEditing && expense) {
        await updateExpense(expense.id, expenseData);
        toast({
          title: "Expense Updated",
          description: `Successfully updated "${data.description}"`,
          variant: "default",
        });
      } else {
        await createExpense(expenseData);
        toast({
          title: "Expense Created",
          description: `Successfully created "${data.description}"`,
          variant: "default",
        });
      }

      // Redirect to expenses list
      router.push("/expenses");
      router.refresh();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} expense: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Merchant Name */}
          <FormField
            control={form.control}
            name="merchant_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Where did you spend?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="What did you buy?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="spent_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={locationEnabled ? clearLocation : getCurrentLocation}
                  >
                    <MapPinIcon className="mr-2 h-4 w-4" />
                    {locationEnabled ? "Clear Location" : "Add Location"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recurring */}
          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Expense</FormLabel>
                  <FormDescription>
                    This is a regular expense that occurs periodically
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Impulse Purchase */}
          <FormField
            control={form.control}
            name="is_impulse"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Impulse Purchase</FormLabel>
                  <FormDescription>
                    This was an unplanned or spontaneous purchase
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about this expense"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Receipt Upload */}
        <FormField
          control={form.control}
          name="receipt_image"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Receipt</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleReceiptChange}
                    {...field}
                  />
                  {receiptPreview && (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-20 w-20 object-cover"
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Split Expense */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={toggleSplitOptions}
          >
            <SplitIcon className="mr-2 h-4 w-4" />
            {showSplitOptions ? "Remove Split" : "Split Expense"}
          </Button>

          {showSplitOptions && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="split_with_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Split with (enter name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="split_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Split Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/expenses")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <AlertTriangleIcon className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Expense" : "Create Expense"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}