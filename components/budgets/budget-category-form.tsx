"use client"

import { useState, useEffect } from "react"
import { Plus, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { getCategories } from "@/app/actions/categories"
import { CategorySelector } from "./category-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface BudgetCategory {
  id?: string
  name: string
  amount: number
  percentage: number
  amount_allocated?: number
  subcategories?: BudgetCategory[]
  color?: string
  is_income?: boolean
}

const defaultCategories: BudgetCategory[] = [
  {
    name: "Housing",
    amount: 0,
    percentage: 30,
    subcategories: [
      { name: "Rent/Mortgage", amount: 0, percentage: 0 },
      { name: "Electricity", amount: 0, percentage: 0 },
      { name: "Water/Sewer", amount: 0, percentage: 0 },
      { name: "Natural Gas/Heating", amount: 0, percentage: 0 },
      { name: "Internet", amount: 0, percentage: 0 },
      { name: "Cable/Satellite TV", amount: 0, percentage: 0 },
      { name: "Phone (Landline)", amount: 0, percentage: 0 },
      { name: "Trash/Recycling", amount: 0, percentage: 0 },
      { name: "Home Repairs", amount: 0, percentage: 0 },
      { name: "Lawn/Garden", amount: 0, percentage: 0 },
      { name: "Cleaning Services", amount: 0, percentage: 0 },
      { name: "Property Tax", amount: 0, percentage: 0 },
      { name: "Home Insurance", amount: 0, percentage: 0 },
      { name: "Mortgage Insurance", amount: 0, percentage: 0 },
      { name: "HOA/Condo Fees", amount: 0, percentage: 0 },
      { name: "Furniture", amount: 0, percentage: 0 },
      { name: "Appliances", amount: 0, percentage: 0 },
      { name: "Home Decor", amount: 0, percentage: 0 },
      { name: "Security System", amount: 0, percentage: 0 },
      { name: "Pest Control", amount: 0, percentage: 0 },
      { name: "Renters Insurance", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Transportation",
    amount: 0,
    percentage: 15,
    subcategories: [
      { name: "Car Payment/Lease", amount: 0, percentage: 0 },
      { name: "Car Loan Interest", amount: 0, percentage: 0 },
      { name: "Gasoline/Fuel", amount: 0, percentage: 0 },
      { name: "Electric Vehicle Charging", amount: 0, percentage: 0 },
      { name: "Auto Insurance", amount: 0, percentage: 0 },
      { name: "Registration & DMV Fees", amount: 0, percentage: 0 },
      { name: "Oil Changes", amount: 0, percentage: 0 },
      { name: "Tire Replacement", amount: 0, percentage: 0 },
      { name: "Car Repairs", amount: 0, percentage: 0 },
      { name: "Car Wash/Detailing", amount: 0, percentage: 0 },
      { name: "Public Transit Pass", amount: 0, percentage: 0 },
      { name: "Bus Fares", amount: 0, percentage: 0 },
      { name: "Subway/Metro Fares", amount: 0, percentage: 0 },
      { name: "Train Tickets", amount: 0, percentage: 0 },
      { name: "Uber/Lyft", amount: 0, percentage: 0 },
      { name: "Taxi", amount: 0, percentage: 0 },
      { name: "Parking Fees", amount: 0, percentage: 0 },
      { name: "Garage Rental", amount: 0, percentage: 0 },
      { name: "Tolls/E-ZPass", amount: 0, percentage: 0 },
      { name: "Bicycle Maintenance", amount: 0, percentage: 0 },
      { name: "Scooter Rentals", amount: 0, percentage: 0 },
      { name: "Roadside Assistance", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Food",
    amount: 0,
    percentage: 15,
    subcategories: [
      { name: "Supermarket Groceries", amount: 0, percentage: 0 },
      { name: "Specialty Food Stores", amount: 0, percentage: 0 },
      { name: "Farmers Markets", amount: 0, percentage: 0 },
      { name: "Organic/Health Foods", amount: 0, percentage: 0 },
      { name: "Meat/Seafood", amount: 0, percentage: 0 },
      { name: "Bakery Items", amount: 0, percentage: 0 },
      { name: "Snacks", amount: 0, percentage: 0 },
      { name: "Non-alcoholic Beverages", amount: 0, percentage: 0 },
      { name: "Alcoholic Beverages", amount: 0, percentage: 0 },
      { name: "Fast Food", amount: 0, percentage: 0 },
      { name: "Casual Dining", amount: 0, percentage: 0 },
      { name: "Fine Dining", amount: 0, percentage: 0 },
      { name: "Breakfast Out", amount: 0, percentage: 0 },
      { name: "Lunch Out", amount: 0, percentage: 0 },
      { name: "Dinner Out", amount: 0, percentage: 0 },
      { name: "Coffee Shops", amount: 0, percentage: 0 },
      { name: "Food Delivery Services", amount: 0, percentage: 0 },
      { name: "Meal Kit Subscriptions", amount: 0, percentage: 0 },
      { name: "Work Lunches", amount: 0, percentage: 0 },
      { name: "School Lunches", amount: 0, percentage: 0 },
      { name: "Vending Machines", amount: 0, percentage: 0 },
      { name: "Special Occasions/Holidays", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Utilities",
    amount: 0,
    percentage: 10,
    subcategories: [
      { name: "Electricity", amount: 0, percentage: 0 },
      { name: "Water & Sewer", amount: 0, percentage: 0 },
      { name: "Natural Gas/Heating", amount: 0, percentage: 0 },
      { name: "Garbage & Recycling", amount: 0, percentage: 0 },
      { name: "Internet Service", amount: 0, percentage: 0 },
      { name: "Mobile Phone Plan", amount: 0, percentage: 0 },
      { name: "Landline Phone", amount: 0, percentage: 0 },
      { name: "Cable/Satellite TV", amount: 0, percentage: 0 },
      { name: "Netflix", amount: 0, percentage: 0 },
      { name: "Hulu", amount: 0, percentage: 0 },
      { name: "Disney+", amount: 0, percentage: 0 },
      { name: "Amazon Prime Video", amount: 0, percentage: 0 },
      { name: "HBO Max", amount: 0, percentage: 0 },
      { name: "Apple TV+", amount: 0, percentage: 0 },
      { name: "Spotify/Music Services", amount: 0, percentage: 0 },
      { name: "YouTube Premium", amount: 0, percentage: 0 },
      { name: "Gaming Subscriptions", amount: 0, percentage: 0 },
      { name: "Cloud Storage", amount: 0, percentage: 0 },
      { name: "VPN Service", amount: 0, percentage: 0 },
      { name: "Home Security Monitoring", amount: 0, percentage: 0 },
      { name: "Smart Home Services", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Health",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "Health Insurance Premium", amount: 0, percentage: 0 },
      { name: "Health Insurance Deductible", amount: 0, percentage: 0 },
      { name: "Health Insurance Copays", amount: 0, percentage: 0 },
      { name: "Prescription Medications", amount: 0, percentage: 0 },
      { name: "Over-the-Counter Medications", amount: 0, percentage: 0 },
      { name: "Vitamins & Supplements", amount: 0, percentage: 0 },
      { name: "Primary Care Visits", amount: 0, percentage: 0 },
      { name: "Specialist Visits", amount: 0, percentage: 0 },
      { name: "Urgent Care", amount: 0, percentage: 0 },
      { name: "Emergency Room", amount: 0, percentage: 0 },
      { name: "Hospital Stays", amount: 0, percentage: 0 },
      { name: "Lab Tests & X-rays", amount: 0, percentage: 0 },
      { name: "Dental Insurance", amount: 0, percentage: 0 },
      { name: "Dental Checkups", amount: 0, percentage: 0 },
      { name: "Dental Procedures", amount: 0, percentage: 0 },
      { name: "Orthodontics", amount: 0, percentage: 0 },
      { name: "Vision Insurance", amount: 0, percentage: 0 },
      { name: "Eye Exams", amount: 0, percentage: 0 },
      { name: "Glasses/Contacts", amount: 0, percentage: 0 },
      { name: "LASIK/Eye Surgery", amount: 0, percentage: 0 },
      { name: "Gym Membership", amount: 0, percentage: 0 },
      { name: "Fitness Classes", amount: 0, percentage: 0 },
      { name: "Home Exercise Equipment", amount: 0, percentage: 0 },
      { name: "Sports Fees & Equipment", amount: 0, percentage: 0 },
      { name: "Mental Health Services", amount: 0, percentage: 0 },
      { name: "Therapy/Counseling", amount: 0, percentage: 0 },
      { name: "Chiropractic Care", amount: 0, percentage: 0 },
      { name: "Massage Therapy", amount: 0, percentage: 0 },
      { name: "Alternative Medicine", amount: 0, percentage: 0 },
      { name: "Medical Devices", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Personal Care",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "Haircuts & Styling", amount: 0, percentage: 0 },
      { name: "Hair Coloring", amount: 0, percentage: 0 },
      { name: "Hair Products", amount: 0, percentage: 0 },
      { name: "Makeup & Cosmetics", amount: 0, percentage: 0 },
      { name: "Skincare Products", amount: 0, percentage: 0 },
      { name: "Facial Treatments", amount: 0, percentage: 0 },
      { name: "Manicures & Pedicures", amount: 0, percentage: 0 },
      { name: "Shaving Supplies", amount: 0, percentage: 0 },
      { name: "Deodorant & Perfume", amount: 0, percentage: 0 },
      { name: "Oral Care", amount: 0, percentage: 0 },
      { name: "Bath & Body Products", amount: 0, percentage: 0 },
      { name: "Men's Clothing", amount: 0, percentage: 0 },
      { name: "Women's Clothing", amount: 0, percentage: 0 },
      { name: "Children's Clothing", amount: 0, percentage: 0 },
      { name: "Shoes", amount: 0, percentage: 0 },
      { name: "Accessories", amount: 0, percentage: 0 },
      { name: "Jewelry", amount: 0, percentage: 0 },
      { name: "Watches", amount: 0, percentage: 0 },
      { name: "Dry Cleaning", amount: 0, percentage: 0 },
      { name: "Laundry Supplies", amount: 0, percentage: 0 },
      { name: "Laundromat", amount: 0, percentage: 0 },
      { name: "Spa Services", amount: 0, percentage: 0 },
      { name: "Massage Therapy", amount: 0, percentage: 0 },
      { name: "Waxing & Hair Removal", amount: 0, percentage: 0 },
      { name: "Tanning", amount: 0, percentage: 0 },
      { name: "Personal Hygiene Products", amount: 0, percentage: 0 },
      { name: "Feminine Hygiene Products", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Entertainment",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "Movie Tickets", amount: 0, percentage: 0 },
      { name: "Movie Rentals/Purchases", amount: 0, percentage: 0 },
      { name: "Concert Tickets", amount: 0, percentage: 0 },
      { name: "Music Purchases/Downloads", amount: 0, percentage: 0 },
      { name: "Live Theater/Shows", amount: 0, percentage: 0 },
      { name: "Sports Event Tickets", amount: 0, percentage: 0 },
      { name: "Sporting Equipment", amount: 0, percentage: 0 },
      { name: "Museum/Exhibition Tickets", amount: 0, percentage: 0 },
      { name: "Theme Parks", amount: 0, percentage: 0 },
      { name: "Zoos & Aquariums", amount: 0, percentage: 0 },
      { name: "Hobbies - Art Supplies", amount: 0, percentage: 0 },
      { name: "Hobbies - Crafting", amount: 0, percentage: 0 },
      { name: "Hobbies - Photography", amount: 0, percentage: 0 },
      { name: "Hobbies - Gardening", amount: 0, percentage: 0 },
      { name: "Hobbies - Collectibles", amount: 0, percentage: 0 },
      { name: "Hobbies - Musical Instruments", amount: 0, percentage: 0 },
      { name: "Magazine Subscriptions", amount: 0, percentage: 0 },
      { name: "Newspaper Subscriptions", amount: 0, percentage: 0 },
      { name: "Book Purchases - Physical", amount: 0, percentage: 0 },
      { name: "Book Purchases - Digital", amount: 0, percentage: 0 },
      { name: "Audiobook Subscriptions", amount: 0, percentage: 0 },
      { name: "Gaming - Console", amount: 0, percentage: 0 },
      { name: "Gaming - PC", amount: 0, percentage: 0 },
      { name: "Gaming - Mobile", amount: 0, percentage: 0 },
      { name: "Gaming - Subscriptions", amount: 0, percentage: 0 },
      { name: "Gaming - In-app Purchases", amount: 0, percentage: 0 },
      { name: "Parties & Social Events", amount: 0, percentage: 0 },
      { name: "Dating", amount: 0, percentage: 0 },
      { name: "Toys & Games", amount: 0, percentage: 0 },
      { name: "Streaming Device Hardware", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Education",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "College Tuition", amount: 0, percentage: 0 },
      { name: "Private School Tuition", amount: 0, percentage: 0 },
      { name: "Vocational Training", amount: 0, percentage: 0 },
      { name: "Textbooks", amount: 0, percentage: 0 },
      { name: "Educational Books", amount: 0, percentage: 0 },
      { name: "E-books & Digital Materials", amount: 0, percentage: 0 },
      { name: "Online Courses", amount: 0, percentage: 0 },
      { name: "Professional Certifications", amount: 0, percentage: 0 },
      { name: "Continuing Education", amount: 0, percentage: 0 },
      { name: "Workshops & Seminars", amount: 0, percentage: 0 },
      { name: "Language Learning", amount: 0, percentage: 0 },
      { name: "Tutoring", amount: 0, percentage: 0 },
      { name: "Educational Software", amount: 0, percentage: 0 },
      { name: "Educational Apps", amount: 0, percentage: 0 },
      { name: "Student Loan - Federal", amount: 0, percentage: 0 },
      { name: "Student Loan - Private", amount: 0, percentage: 0 },
      { name: "School Supplies", amount: 0, percentage: 0 },
      { name: "Lab Fees", amount: 0, percentage: 0 },
      { name: "Research Materials", amount: 0, percentage: 0 },
      { name: "Educational Conferences", amount: 0, percentage: 0 },
      { name: "Professional Memberships", amount: 0, percentage: 0 },
      { name: "Study Abroad", amount: 0, percentage: 0 },
      { name: "College Application Fees", amount: 0, percentage: 0 },
      { name: "Testing Fees (SAT, GRE, etc.)", amount: 0, percentage: 0 },
      { name: "Children's Education", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Debt Payments",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "Credit Card - Minimum Payment", amount: 0, percentage: 0 },
      { name: "Credit Card - Extra Payment", amount: 0, percentage: 0 },
      { name: "Credit Card - Interest Charges", amount: 0, percentage: 0 },
      { name: "Credit Card - Annual Fees", amount: 0, percentage: 0 },
      { name: "Personal Loan - Principal", amount: 0, percentage: 0 },
      { name: "Personal Loan - Interest", amount: 0, percentage: 0 },
      { name: "Student Loan - Federal", amount: 0, percentage: 0 },
      { name: "Student Loan - Private", amount: 0, percentage: 0 },
      { name: "Student Loan - Interest", amount: 0, percentage: 0 },
      { name: "Auto Loan Payment", amount: 0, percentage: 0 },
      { name: "Auto Loan - Interest", amount: 0, percentage: 0 },
      { name: "Medical Debt Payment", amount: 0, percentage: 0 },
      { name: "Medical Payment Plan", amount: 0, percentage: 0 },
      { name: "Payday Loan", amount: 0, percentage: 0 },
      { name: "Home Equity Loan", amount: 0, percentage: 0 },
      { name: "Line of Credit Payment", amount: 0, percentage: 0 },
      { name: "Family Loan Repayment", amount: 0, percentage: 0 },
      { name: "Debt Consolidation Payment", amount: 0, percentage: 0 },
      { name: "Collections Payment", amount: 0, percentage: 0 },
      { name: "Legal Judgment Payment", amount: 0, percentage: 0 },
      { name: "Back Taxes Payment", amount: 0, percentage: 0 },
      { name: "Debt Settlement Fees", amount: 0, percentage: 0 },
      { name: "Credit Counseling Fees", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Savings",
    amount: 0,
    percentage: 10,
    subcategories: [
      { name: "Emergency Fund", amount: 0, percentage: 0 },
      { name: "Rainy Day Fund", amount: 0, percentage: 0 },
      { name: "401(k) Contribution", amount: 0, percentage: 0 },
      { name: "IRA Contribution", amount: 0, percentage: 0 },
      { name: "Roth IRA Contribution", amount: 0, percentage: 0 },
      { name: "Employer Match", amount: 0, percentage: 0 },
      { name: "Pension Contribution", amount: 0, percentage: 0 },
      { name: "SEP IRA (Self-employed)", amount: 0, percentage: 0 },
      { name: "Stock Investments", amount: 0, percentage: 0 },
      { name: "Mutual Funds", amount: 0, percentage: 0 },
      { name: "ETFs", amount: 0, percentage: 0 },
      { name: "Bonds", amount: 0, percentage: 0 },
      { name: "Real Estate Investments", amount: 0, percentage: 0 },
      { name: "Cryptocurrency", amount: 0, percentage: 0 },
      { name: "Precious Metals", amount: 0, percentage: 0 },
      { name: "Vacation/Travel Fund", amount: 0, percentage: 0 },
      { name: "Home Down Payment", amount: 0, percentage: 0 },
      { name: "Vehicle Purchase", amount: 0, percentage: 0 },
      { name: "Appliance Replacement", amount: 0, percentage: 0 },
      { name: "Electronics/Gadgets", amount: 0, percentage: 0 },
      { name: "Furniture Fund", amount: 0, percentage: 0 },
      { name: "Home Renovation", amount: 0, percentage: 0 },
      { name: "Wedding Fund", amount: 0, percentage: 0 },
      { name: "Baby/Child Expenses", amount: 0, percentage: 0 },
      { name: "College Fund (529 Plan)", amount: 0, percentage: 0 },
      { name: "Health Savings Account", amount: 0, percentage: 0 },
      { name: "Flexible Spending Account", amount: 0, percentage: 0 },
      { name: "Business Investment", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Giving",
    amount: 0,
    percentage: 5,
    subcategories: [
      { name: "Local Charities", amount: 0, percentage: 0 },
      { name: "National Charities", amount: 0, percentage: 0 },
      { name: "International Charities", amount: 0, percentage: 0 },
      { name: "Disaster Relief", amount: 0, percentage: 0 },
      { name: "Medical Research", amount: 0, percentage: 0 },
      { name: "Environmental Causes", amount: 0, percentage: 0 },
      { name: "Animal Welfare", amount: 0, percentage: 0 },
      { name: "Education/Scholarship Funds", amount: 0, percentage: 0 },
      { name: "Homeless Services", amount: 0, percentage: 0 },
      { name: "Food Banks", amount: 0, percentage: 0 },
      { name: "Religious Tithing", amount: 0, percentage: 0 },
      { name: "Church Offerings", amount: 0, percentage: 0 },
      { name: "Religious Building Fund", amount: 0, percentage: 0 },
      { name: "Religious Community Events", amount: 0, percentage: 0 },
      { name: "Religious Mission Trips", amount: 0, percentage: 0 },
      { name: "Family Financial Support", amount: 0, percentage: 0 },
      { name: "Elderly Parent Care", amount: 0, percentage: 0 },
      { name: "Sibling Support", amount: 0, percentage: 0 },
      { name: "Child Support (Non-court)", amount: 0, percentage: 0 },
      { name: "Extended Family Help", amount: 0, percentage: 0 },
      { name: "Birthday Gifts", amount: 0, percentage: 0 },
      { name: "Holiday Gifts", amount: 0, percentage: 0 },
      { name: "Wedding Gifts", amount: 0, percentage: 0 },
      { name: "Baby Shower Gifts", amount: 0, percentage: 0 },
      { name: "Anniversary Gifts", amount: 0, percentage: 0 },
      { name: "Graduation Gifts", amount: 0, percentage: 0 },
      { name: "Housewarming Gifts", amount: 0, percentage: 0 },
      { name: "Spontaneous Giving", amount: 0, percentage: 0 },
      { name: "Crowdfunding Contributions", amount: 0, percentage: 0 },
      { name: "Political Donations", amount: 0, percentage: 0 }
    ]
  }
]

interface CategoryFormProps {
  category: BudgetCategory
  onUpdate: (category: BudgetCategory) => void
  onDelete: () => void
  isSubcategory?: boolean
}

function CategoryForm({ category, onUpdate, onDelete, isSubcategory = false }: CategoryFormProps) {
  const handleChange = (field: keyof BudgetCategory, value: string | number) => {
    onUpdate({
      ...category,
      [field]: value
    })
  }

  return (
    <div className={cn(
      "grid gap-4",
      isSubcategory ? "grid-cols-[1fr_100px_40px]" : "grid-cols-[1fr_100px_100px_40px]"
    )}>
      <div>
        <Input
          placeholder="Category name"
          value={category.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>
      <div>
        <Input
          type="number"
          placeholder="Amount"
          value={category.amount || ""}
          onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
        />
      </div>
      {!isSubcategory && (
        <div>
          <Input
            type="number"
            placeholder="Percentage"
            value={category.percentage || ""}
            onChange={(e) => handleChange("percentage", parseFloat(e.target.value) || 0)}
          />
        </div>
      )}
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface BudgetCategoryFormProps {
  onSave: (categories: BudgetCategory[]) => void
  initialCategories?: BudgetCategory[]
  useExistingCategories?: boolean
}

export function BudgetCategoryForm({ onSave, initialCategories, useExistingCategories = true }: BudgetCategoryFormProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories || [])
  const [openCategories, setOpenCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("templates")
  const [userCategories, setUserCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  
  // Fetch user categories when component mounts
  useEffect(() => {
    async function fetchUserCategories() {
      if (useExistingCategories) {
        try {
          setLoading(true)
          const { categories: fetchedCategories } = await getCategories()
          setUserCategories(fetchedCategories || [])
        } catch (error) {
          console.error("Error fetching categories:", error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchUserCategories()
    
    // If no initial categories provided, use default categories
    if (!initialCategories || initialCategories.length === 0) {
      setCategories(defaultCategories)
    }
  }, [initialCategories, useExistingCategories])

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => 
      prev.includes(name) 
        ? prev.filter(c => c !== name)
        : [...prev, name]
    )
  }

  const addCategory = () => {
    setCategories(prev => [...prev, {
      name: "",
      amount: 0,
      percentage: 0,
      subcategories: []
    }])
  }
  
  const addExistingCategory = () => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first")
      return
    }
    
    const selectedCategory = userCategories.find(cat => cat.id === selectedCategoryId)
    if (!selectedCategory) return
    
    // Check if category already exists in the budget
    const categoryExists = categories.some(cat => 
      cat.name.toLowerCase() === selectedCategory.name.toLowerCase()
    )
    
    if (categoryExists) {
      toast.error(`Category '${selectedCategory.name}' already exists in your budget`)
      return
    }
    
    // Add the category with default percentage and preserve the original ID
    setCategories(prev => [...prev, {
      id: selectedCategory.id, // Preserve the original category ID
      name: selectedCategory.name,
      amount: 0,
      percentage: 10, // Default percentage
      subcategories: [],
      color: selectedCategory.color, // Keep the color from the original category
      is_income: selectedCategory.is_income // Preserve income status
    }])
    
    // Reset selection
    setSelectedCategoryId("")
    toast.success(`Added '${selectedCategory.name}' to your budget`)
  }

  const addSubcategory = (categoryIndex: number) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (!newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories = []
      }
      newCategories[categoryIndex].subcategories?.push({
        name: "",
        amount: 0,
        percentage: 0
      })
      return newCategories
    })
  }

  const updateCategory = (categoryIndex: number, updatedCategory: BudgetCategory) => {
    setCategories(prev => {
      const newCategories = [...prev]
      newCategories[categoryIndex] = updatedCategory
      return newCategories
    })
  }

  const updateSubcategory = (categoryIndex: number, subcategoryIndex: number, updatedSubcategory: BudgetCategory) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories![subcategoryIndex] = updatedSubcategory
      }
      return newCategories
    })
  }

  const deleteCategory = (categoryIndex: number) => {
    setCategories(prev => prev.filter((_, index) => index !== categoryIndex))
  }

  const deleteSubcategory = (categoryIndex: number, subcategoryIndex: number) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories = 
          newCategories[categoryIndex].subcategories!.filter((_, index) => index !== subcategoryIndex)
      }
      return newCategories
    })
  }

  const handleSave = () => {
    // Ensure all categories have proper calculations before saving
    const processedCategories = categories.map(category => {
      // Make sure percentage is a number (for UI calculations only)
      const percentage = typeof category.percentage === 'number' ? category.percentage : 0;
      
      // Calculate amount based on percentage
      const calculatedAmount = category.amount || (percentage / 100) * 100; // Default to 100 if no total amount
      
      // Process subcategories if they exist
      const subcategories = category.subcategories?.map(sub => {
        // Make sure subcategory percentage is a number (for UI calculations only)
        const subPercentage = typeof sub.percentage === 'number' ? sub.percentage : 0;
        
        // Calculate subcategory amount based on parent category amount
        const subAmount = (subPercentage / 100) * calculatedAmount;
        
        return {
          ...sub,
          id: sub.id || undefined, // Preserve original ID if it exists
          percentage: subPercentage, // Keep percentage for UI calculations
          amount: subAmount, // Keep amount for UI calculations
          amount_allocated: subAmount, // Add amount_allocated for database compatibility
        };
      }) || [];
      
      return {
        ...category,
        id: category.id || undefined, // Preserve original ID if it exists
        percentage: percentage, // Keep percentage for UI calculations
        amount: calculatedAmount, // Keep amount for UI calculations
        amount_allocated: calculatedAmount, // Add amount_allocated for database compatibility
        subcategories: subcategories,
        // Keep color only for UI, not for database
        is_income: category.is_income // Preserve income status
      };
    });
    
    // Calculate total allocation percentage
    const totalPercentage = processedCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    
    // Warn if total allocation is not 100%
    if (totalPercentage < 95 || totalPercentage > 105) {
      toast.warning(`Your total allocation is ${totalPercentage.toFixed(1)}%. Consider adjusting to reach 100%.`);
    }
    
    console.log('Saving processed categories:', processedCategories);
    onSave(processedCategories);
  }

  // Add custom scrollbar styles
  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: hsl(var(--background));
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.5);
    }
  `;

  return (
    <Card>
      <style jsx global>{customScrollbarStyles}</style>
      <CardHeader>
        <CardTitle>Budget Categories</CardTitle>
        <CardDescription>
          Define how your budget will be allocated across different categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="existing">Existing Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((category, categoryIndex) => (
                <Collapsible
                  key={categoryIndex}
                  open={openCategories.includes(category.name)}
                  onOpenChange={() => toggleCategory(category.name)}
                  className="mb-4 border rounded-md p-2 bg-background shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 sticky top-0 bg-background z-10 py-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {openCategories.includes(category.name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <div className="flex-1">
                        <CategoryForm
                          category={category}
                          onUpdate={(updated) => updateCategory(categoryIndex, updated)}
                          onDelete={() => deleteCategory(categoryIndex)}
                        />
                      </div>
                    </div>
                    
                    <CollapsibleContent className="space-y-2">
                      <div className="max-h-[30vh] overflow-y-auto pl-6 pr-1 custom-scrollbar">
                        {category.subcategories?.map((subcategory, subcategoryIndex) => (
                          <div key={subcategoryIndex} className="mb-2">
                            <CategoryForm
                              category={subcategory}
                              onUpdate={(updated) => updateSubcategory(categoryIndex, subcategoryIndex, updated)}
                              onDelete={() => deleteSubcategory(categoryIndex, subcategoryIndex)}
                              isSubcategory
                            />
                          </div>
                        ))}
                      </div>
                      <div className="ml-6 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSubcategory(categoryIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subcategory
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={addCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={handleSave}>Save Categories</Button>
        </div>
          </TabsContent>
          
          <TabsContent value="existing" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading categories...</span>
              </div>
            ) : userCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No custom categories found</p>
                <p className="text-sm text-muted-foreground mt-1">You can add custom categories in the Categories section</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 items-end grid-cols-1 sm:grid-cols-[1fr_auto]">
                  <div>
                    <Label htmlFor="category-selector">Select from your categories</Label>
                    <div className="mt-1">
                      <CategorySelector
                        value={selectedCategoryId}
                        onChange={setSelectedCategoryId}
                        placeholder="Select a category"
                        includeCustomOption={false}
                      />
                    </div>
                  </div>
                  <Button onClick={addExistingCategory} disabled={!selectedCategoryId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Budget
                  </Button>
                </div>
                
                {/* Show current categories */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Current Budget Categories</h3>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories added yet</p>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {categories.map((category, categoryIndex) => (
                        <Collapsible
                          key={categoryIndex}
                          open={openCategories.includes(category.name)}
                          onOpenChange={() => toggleCategory(category.name)}
                          className="mb-4 border rounded-md p-2 bg-background shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 sticky top-0 bg-background z-10 py-1">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {openCategories.includes(category.name) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <div className="flex-1">
                                <CategoryForm
                                  category={category}
                                  onUpdate={(updated) => updateCategory(categoryIndex, updated)}
                                  onDelete={() => deleteCategory(categoryIndex)}
                                />
                              </div>
                            </div>
                            
                            <CollapsibleContent className="space-y-2">
                              <div className="max-h-[30vh] overflow-y-auto pl-6 pr-1 custom-scrollbar">
                                {category.subcategories?.map((subcategory, subcategoryIndex) => (
                                  <div key={subcategoryIndex} className="mb-2">
                                    <CategoryForm
                                      category={subcategory}
                                      onUpdate={(updated) => updateSubcategory(categoryIndex, subcategoryIndex, updated)}
                                      onDelete={() => deleteSubcategory(categoryIndex, subcategoryIndex)}
                                      isSubcategory
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="ml-6 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addSubcategory(categoryIndex)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Subcategory
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={addCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Category
                  </Button>
                  <Button onClick={handleSave}>Save Categories</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
