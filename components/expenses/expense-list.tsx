"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2, MapPin, Receipt, CalendarClock, Clock, Tag, AlertTriangle, Filter, Search, X, DollarSign } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getExpenses, deleteExpense, updateExpense, LocationSearchParams, searchExpensesByLocation } from "@/app/actions/expenses"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ExpenseCategories } from "@/types/expense"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ALL_CATEGORIES } from "@/lib/constants/categories"
import { formatCurrency } from "@/lib/utils"

export function ExpenseList() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationSearch, setLocationSearch] = useState<LocationSearchParams | null>(null)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [locationRadius, setLocationRadius] = useState(1000) // Default 1km
  const { toast } = useToast()
  const router = useRouter()
  
  // We'll calculate total expenses after filteredExpenses is defined
  
  // Function to get a consistent color for each category
  const getCategoryColor = (categoryId: string) => {
    const category = ALL_CATEGORIES.find(cat => cat.id === categoryId);
    if (category) {
      return category.color;
    }
    
    // Fallback to hash-based color if category not found
    const hash = Array.from(categoryId).reduce(
      (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
    );
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  // Function to get category name from ID
  const getCategoryName = (categoryId: string) => {
    const category = ALL_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  // Extract unique categories from expenses for the filter dropdown
  const categories = useMemo(() => {
    // Start with 'all' option
    const result = [{ id: 'all', name: 'All Categories' }];
    
    // Add all expense categories that are not income
    const expenseCategories = ALL_CATEGORIES
      .filter(cat => !cat.is_income)
      .map(cat => ({ id: cat.id, name: cat.name }));
    
    return [...result, ...expenseCategories];
  }, []);
  
  // Filter expenses based on selected category and search query
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || 
        (expense.category === selectedCategory);
      
      // Search query filter
      const searchMatch = !searchQuery || 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.merchant_name && expense.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // We don't need to filter by location here since that's done at the database level
      // when we call searchExpensesByLocation
      
      return categoryMatch && searchMatch;
    });
  }, [expenses, selectedCategory, searchQuery]);
  
  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  // Listen for expense changes (add, update, delete) via localStorage events
  useEffect(() => {
    // Initial fetch
    fetchExpenses()
    
    // Set up event listeners for expense changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'expense_added' || 
          event.key === 'expense_updated' || 
          event.key === 'expense_deleted') {
        fetchExpenses()
      }
    }
    
    // Also listen for direct events (for same-window updates)
    const handleCustomEvent = () => {
      fetchExpenses()
    }
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('expense_updated', handleCustomEvent)
    window.addEventListener('expense_added', handleCustomEvent)
    window.addEventListener('expense_deleted', handleCustomEvent)
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('expense_updated', handleCustomEvent)
      window.removeEventListener('expense_added', handleCustomEvent)
      window.removeEventListener('expense_deleted', handleCustomEvent)
    }
  }, [])

  const fetchExpenses = async () => {
    // Don't show loading indicator for refreshes, only initial load
    const isInitialLoad = expenses.length === 0
    if (isInitialLoad) {
      setLoading(true)
    }
    
    try {
      let data;
      if (locationSearch) {
        // If we have location search parameters, use the location search function
        data = await searchExpensesByLocation(locationSearch);
        toast({
          title: "Location Filter Applied",
          description: `Showing expenses near ${locationSearch.locationName || 'selected location'} (${locationSearch.radiusMeters}m radius)`,
        });
      } else {
        // Otherwise use the regular getExpenses function
        data = await getExpenses();
      }
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      await deleteExpense(id)
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
      
      // Trigger refresh of visualizations and expense list
      if (typeof window !== 'undefined') {
        // Update localStorage to trigger events in other components
        localStorage.setItem('expense_deleted', Date.now().toString());
        
        // Dispatch both storage and custom events
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'expense_deleted',
          newValue: Date.now().toString()
        }));
        
        // Custom event for same-window updates
        window.dispatchEvent(new Event('expense_deleted'));
      }
      
      // Refresh the list
      fetchExpenses()
      
      // Refresh the page to update visualizations
      router.refresh()
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  // Function to handle location search
  const handleLocationSearch = () => {
    // Get values from inputs
    const latInput = document.getElementById('latitude') as HTMLInputElement;
    const lngInput = document.getElementById('longitude') as HTMLInputElement;
    
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Error",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      });
      return;
    }
    
    // Create location search params
    const params: LocationSearchParams = {
      latitude: lat,
      longitude: lng,
      radiusMeters: locationRadius,
      locationName: locationName || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
    
    setLocationSearch(params);
    setLocationDialogOpen(false);
    fetchExpenses();
  };

  // Function to get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          document.getElementById('latitude')!.setAttribute('value', lat.toString());
          document.getElementById('longitude')!.setAttribute('value', lng.toString());
          
          if (!locationName) {
            setLocationName('Current Location');
          }
          
          toast({
            title: "Location Found",
            description: `Using your current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          });
        },
        (error) => {
          toast({
            title: "Error",
            description: `Could not get your location: ${error.message}`,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  const renderExpenseItem = (expense: any) => {
    const category = ALL_CATEGORIES.find(cat => cat.id === expense.category_id);
    const categoryColor = category?.color || '#B5B5B5';
    const categoryName = category?.name || 'Uncategorized';

    return (
      <Card key={expense.id} className="relative overflow-hidden">
        {/* Category color indicator */}
        <div 
          className="absolute top-0 left-0 w-1 h-full" 
          style={{ backgroundColor: categoryColor }}
        />
        
        <CardContent className="p-4 pl-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{expense.description}</h3>
              <div className="text-sm text-muted-foreground space-x-2">
                {expense.merchant_name && (
                  <span className="inline-flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {expense.merchant_name}
                  </span>
                )}
                <span className="inline-flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {categoryName}
                </span>
                <span className="inline-flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(expense.spent_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium">{formatCurrency(expense.amount)}</div>
                {expense.split_amount && (
                  <div className="text-sm text-muted-foreground">
                    Your share: {formatCurrency(expense.split_amount)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/expenses/${expense.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(expense.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {expense.is_recurring && (
              <Badge variant="outline" className="border-blue-500 text-blue-500">
                <CalendarClock className="w-3 h-3 mr-1" />
                Recurring
              </Badge>
            )}
            {expense.is_impulse && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Impulse
              </Badge>
            )}
            {expense.location && (
              <Badge variant="secondary">
                <MapPin className="w-3 h-3 mr-1" />
                Location
              </Badge>
            )}
            {expense.receipt_url && (
              <Badge variant="secondary">
                <Receipt className="w-3 h-3 mr-1" />
                Receipt
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription className="mt-1">Filter and view your expenses by category</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-lg font-bold mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Total: {formatCurrency(totalExpenses)}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/expenses/new" className="flex items-center gap-1">
                <span>Add Expense</span>
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="flex-1">
            <Input 
              placeholder="Search expenses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ALL_CATEGORIES.filter(cat => !cat.is_income).map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color || "#888" }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Location search button */}
          <Popover open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                {locationSearch ? 'Location Filter Active' : 'Search by Location'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Location Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Find expenses near a specific location
                  </p>
                </div>
                
                {locationSearch ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium">Current Location Filter:</div>
                      <Badge className="self-start">
                        <MapPin className="h-3 w-3 mr-1" />
                        {locationSearch.locationName || 'Selected Location'}
                      </Badge>
                      <div className="text-sm">{locationSearch.radiusMeters}m radius</div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => {
                        setLocationSearch(null);
                        setLocationDialogOpen(false);
                        fetchExpenses();
                      }}>
                        Clear Filter
                      </Button>
                      <Button size="sm" onClick={() => setLocationDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="location-name">Location Name</Label>
                      <Input 
                        id="location-name" 
                        placeholder="e.g., Downtown Mall" 
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input id="latitude" placeholder="e.g., 37.7749" type="number" step="0.0001" />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input id="longitude" placeholder="e.g., -122.4194" type="number" step="0.0001" />
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <Label htmlFor="radius">Search Radius (meters)</Label>
                        <span className="text-sm text-muted-foreground">{locationRadius}m</span>
                      </div>
                      <Input 
                        id="radius" 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="100" 
                        value={locationRadius}
                        onChange={(e) => setLocationRadius(parseInt(e.target.value))}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100m</span>
                        <span>5km</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={getCurrentLocation}>
                        Use My Location
                      </Button>
                      
                      <Button size="sm" onClick={handleLocationSearch}>
                        Search
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {filteredExpenses.length === 0 && !loading ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No expenses found</p>
            <Button asChild>
              <Link href="/expenses/new">Add Your First Expense</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => renderExpenseItem(expense))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
