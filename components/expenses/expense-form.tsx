"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Receipt, Split, AlertTriangle, CalendarDays, User, Upload, Loader2, X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { searchLocationByName, getAddressFromCoordinates } from "@/lib/geocoding";

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
  is_impulse: z.boolean().default(false),
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

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{
    name: string;
    latitude: number;
    longitude: number;
    id: string;
  }>>([]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      merchant_name: expense?.merchant_name || "",
      amount: expense?.amount || "",
      category_id: expense?.category || "",
      description: expense?.description || "",
      spent_at: expense?.spent_at ? new Date(expense.spent_at) : new Date(),
      latitude: expense?.latitude || null,
      longitude: expense?.longitude || null,
      is_recurring: expense?.is_recurring || false,
      is_impulse: expense?.is_impulse || false,
      notes: expense?.notes || "",
      receipt_image: null,
      warranty_expiry: expense?.warranty_expiry ? new Date(expense.warranty_expiry) : null,
      split_with_name: expense?.split_with_name || "",
      split_amount: expense?.split_amount || null,
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
          
          // Get address from coordinates for display
          getAddressFromCoordinates(position.coords.latitude, position.coords.longitude)
            .then(address => {
              if (address) {
                setLocationSearchQuery(address.split(',')[0] || 'Current Location');
              }
            })
            .catch(error => console.error("Error getting address:", error));
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
    form.setValue("latitude", undefined);
    form.setValue("longitude", undefined);
    setLocationEnabled(false);
    setLocationSearchQuery("");
    setLocationSearchResults([]);
  };
  
  // Search for location by name
  const searchLocation = async () => {
    if (!locationSearchQuery || locationSearchQuery.trim().length < 2) {
      toast({
        title: "Search Error",
        description: "Please enter at least 2 characters to search for a location.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearchingLocation(true);
    
    try {
      const results = await searchLocationByName(locationSearchQuery);
      setLocationSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found matching your search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };
  
  // Select a location from search results
  const selectLocation = (location: { name: string; latitude: number; longitude: number; id: string }) => {
    form.setValue("latitude", location.latitude);
    form.setValue("longitude", location.longitude);
    setLocationEnabled(true);
    setLocationSearchQuery(location.name);
    setLocationSearchResults([]);
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
  async function onSubmit(data: ExpenseFormValues) {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    try {
      // Prepare the expense data
      const expenseData = {
        merchant_name: data.merchant_name || null,
        amount: Number(data.amount),
        category_id: data.category_id,
        description: data.description,
        spent_at: data.spent_at,
        location: data.latitude && data.longitude
          ? { latitude: Number(data.latitude), longitude: Number(data.longitude) }
          : null,
        is_recurring: data.is_recurring,
        is_impulse: data.is_impulse,
        notes: data.notes || null,
        warranty_expiry: data.warranty_expiry || null,
        // Add split expense data if applicable
        split_with_name: showSplitOptions ? data.split_with_name : null,
        split_amount: showSplitOptions && data.split_amount ? Number(data.split_amount) : null,
      };

      let expenseId;

      // Create or update the expense
      if (isEditing && expense?.id) {
        await updateExpense(expense.id, expenseData);
        expenseId = expense.id;
      } else {
        const result = await createExpense(expenseData);
        expenseId = result?.id;
      }

      if (!expenseId) {
        throw new Error("Failed to get expense ID");
      }

      // Handle receipt upload if there's a receipt image
      if (fileInputRef.current?.files?.[0] && expenseId) {
        try {
          await uploadReceipt(fileInputRef.current.files[0], expenseId);
        } catch (uploadError) {
          console.error("Error uploading receipt:", uploadError);
          toast({
            title: "Receipt Upload Failed",
            description: "The expense was saved, but we couldn't upload the receipt.",
            variant: "destructive",
          });
        }
      }

      // Handle split expense creation if applicable
      // Note: We've already included split_with_name and split_amount in the main expense data
      // This is a fallback in case the direct approach didn't work
      if (showSplitOptions && data.split_with_name && data.split_amount && expenseId) {
        try {
          // Check if the split information was successfully saved with the expense
          const { data: updatedExpense } = await supabase
            .from("expenses")
            .select("split_with_name, split_amount")
            .eq("id", expenseId)
            .single();
            
          // If split information is missing, use the createSplitExpenseFromForm function
          if (!updatedExpense?.split_with_name || updatedExpense?.split_amount === null) {
            console.log("Split expense columns not found, using alternative approach");
            await createSplitExpenseFromForm({
              expenseId,
              splitWithName: data.split_with_name,
              splitAmount: Number(data.split_amount),
              description: data.description,
            });
          } else {
            console.log("Split expense saved successfully");
          }
        } catch (splitError) {
          console.error("Error creating split expense:", splitError);
          toast({
            title: "Split Expense Failed",
            description: "The expense was saved, but we couldn't create the split record. Please run the add_split_expense_columns.sql migration.",
            variant: "destructive",
          });
        }
      }

      // Show success message
      toast({
        title: isEditing ? "Expense Updated" : "Expense Created",
        description: `Successfully ${isEditing ? "updated" : "created"} expense: ${data.description}`,
      });

      // Use a small timeout to ensure the toast is shown before navigation
      setTimeout(() => {
        // Use window.location for a full page navigation instead of router.push
        // This avoids client-side routing issues with server actions
        window.location.href = "/expenses";
      }, 100);
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} expense. Please try again.`,
        variant: "destructive",
      });
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
                <FormLabel>Merchant Name <span className="text-red-500">*</span></FormLabel>
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
                <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      $
                    </span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-8" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        // If split options are shown, update split amount suggestion
                        if (showSplitOptions) {
                          const totalAmount = parseFloat(e.target.value);
                          if (!isNaN(totalAmount)) {
                            const suggestedSplitAmount = (totalAmount / 2).toFixed(2);
                            form.setValue("split_amount", suggestedSplitAmount);
                          }
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color || '#888' }}
                          />
                          {category.name}
                        </div>
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
                <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="text" placeholder="What did you purchase?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <FormField
            control={form.control}
            name="spent_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
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
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              <div className="flex space-x-2">
                {!locationEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isSubmitting}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearLocation}
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Location
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="Search for a location"
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={searchLocation}
                disabled={isSubmitting || isSearchingLocation}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {locationSearchResults.length > 0 && (
                <div className="rounded-md border p-4 space-y-4">
                  {locationSearchResults.map((location) => (
                    <Button
                      key={location.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectLocation(location)}
                      disabled={isSubmitting}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {locationEnabled && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>Location data will be saved with this expense.</p>
                <input type="hidden" {...form.register("latitude")} />
                <input type="hidden" {...form.register("longitude")} />
              </div>
            )}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="text-base font-medium">Additional Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt_image">Receipt Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="receipt_image"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="w-full justify-start"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {receiptPreview ? "Change Receipt" : "Upload Receipt"}
                  </Button>
                  {receiptPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setReceiptPreview(null);
                        form.setValue("receipt_image", null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {receiptPreview && (
                  <div className="mt-2 relative aspect-video w-full max-w-sm overflow-hidden rounded-md border">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Warranty Expiry */}
              <FormField
                control={form.control}
                name="warranty_expiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Warranty Expiry</FormLabel>
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
                              <span>Set warranty date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Expense</FormLabel>
                    <FormDescription>
                      This expense occurs regularly
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_impulse"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Impulse Purchase</FormLabel>
                    <FormDescription>
                      This was an unplanned purchase
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Split Expense */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split Expense</Label>
              <Switch
                checked={showSplitOptions}
                onCheckedChange={toggleSplitOptions}
                disabled={isSubmitting}
              />
            </div>

            {showSplitOptions && (
              <div className="rounded-md border p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="split_with_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Split With</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter person's name"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Name of the person you're splitting with
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="split_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Share (Amount They Owe)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            value={field.value === null || field.value === undefined ? "" : field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Amount the other person owes you for this expense
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
                    placeholder="Any additional details about this expense..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4">
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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