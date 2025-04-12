import type { BudgetTemplate } from "@/types/budget"

export const LIFE_EVENT_TEMPLATES: BudgetTemplate[] = [
  {
    id: "college",
    name: "College Education",
    description: "4-year college education budget planning",
    type: "zero-based",
    categories: [
      {
        name: "Tuition & Fees",
        percentage: 60,
        amount: 0,
        subcategories: [
          { name: "Tuition", percentage: 50, amount: 0 },
          { name: "Student Fees", percentage: 5, amount: 0 },
          { name: "Books & Supplies", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Housing",
        percentage: 25,
        amount: 0,
        subcategories: [
          { name: "Room & Board", percentage: 20, amount: 0 },
          { name: "Utilities", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Living Expenses",
        percentage: 10,
        amount: 0,
        subcategories: [
          { name: "Food", percentage: 5, amount: 0 },
          { name: "Transportation", percentage: 3, amount: 0 },
          { name: "Personal Care", percentage: 2, amount: 0 },
        ],
      },
      {
        name: "Emergency Fund",
        percentage: 5,
        amount: 0,
      },
    ],
    defaultAllocation: {
      "Tuition & Fees": 60,
      "Housing": 25,
      "Living Expenses": 10,
      "Emergency Fund": 5,
    },
    recommendedIncome: {
      min: 80000,
      max: 200000,
    },
    timeline: "48 months",
    tags: ["education", "college", "long-term"],
  },
  {
    id: "retirement",
    name: "Early Retirement",
    description: "FIRE (Financial Independence, Retire Early) planning",
    type: "50-30-20",
    categories: [
      {
        name: "Investment Portfolio",
        percentage: 50,
        amount: 0,
        subcategories: [
          { name: "Index Funds", percentage: 30, amount: 0 },
          { name: "Real Estate", percentage: 15, amount: 0 },
          { name: "Bonds", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Debt Elimination",
        percentage: 20,
        amount: 0,
        subcategories: [
          { name: "Mortgage", percentage: 15, amount: 0 },
          { name: "Other Debts", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Living Expenses",
        percentage: 20,
        amount: 0,
        subcategories: [
          { name: "Housing", percentage: 10, amount: 0 },
          { name: "Utilities", percentage: 5, amount: 0 },
          { name: "Food", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Healthcare Fund",
        percentage: 10,
        amount: 0,
      },
    ],
    defaultAllocation: {
      "Investment Portfolio": 50,
      "Debt Elimination": 20,
      "Living Expenses": 20,
      "Healthcare Fund": 10,
    },
    recommendedIncome: {
      min: 100000,
      max: 500000,
    },
    timeline: "120 months",
    tags: ["retirement", "investment", "long-term"],
  },
  {
    id: "business-startup",
    name: "Business Startup",
    description: "First-year business launch budget",
    type: "zero-based",
    categories: [
      {
        name: "Startup Costs",
        percentage: 40,
        amount: 0,
        subcategories: [
          { name: "Legal & Licenses", percentage: 10, amount: 0 },
          { name: "Equipment", percentage: 20, amount: 0 },
          { name: "Initial Inventory", percentage: 10, amount: 0 },
        ],
      },
      {
        name: "Operating Expenses",
        percentage: 30,
        amount: 0,
        subcategories: [
          { name: "Rent", percentage: 15, amount: 0 },
          { name: "Utilities", percentage: 5, amount: 0 },
          { name: "Insurance", percentage: 5, amount: 0 },
          { name: "Supplies", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Marketing",
        percentage: 15,
        amount: 0,
        subcategories: [
          { name: "Advertising", percentage: 10, amount: 0 },
          { name: "Website", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Working Capital",
        percentage: 15,
        amount: 0,
      },
    ],
    defaultAllocation: {
      "Startup Costs": 40,
      "Operating Expenses": 30,
      "Marketing": 15,
      "Working Capital": 15,
    },
    recommendedIncome: {
      min: 50000,
      max: 250000,
    },
    timeline: "12 months",
    tags: ["business", "startup", "entrepreneurship"],
  },
  {
    id: "debt-freedom",
    name: "Debt Freedom",
    description: "Debt snowball/avalanche strategy",
    type: "zero-based",
    categories: [
      {
        name: "High Interest Debt",
        percentage: 50,
        amount: 0,
        subcategories: [
          { name: "Credit Cards", percentage: 30, amount: 0 },
          { name: "Personal Loans", percentage: 20, amount: 0 },
        ],
      },
      {
        name: "Medium Interest Debt",
        percentage: 30,
        amount: 0,
        subcategories: [
          { name: "Car Loans", percentage: 20, amount: 0 },
          { name: "Student Loans", percentage: 10, amount: 0 },
        ],
      },
      {
        name: "Low Interest Debt",
        percentage: 10,
        amount: 0,
        subcategories: [
          { name: "Mortgage", percentage: 10, amount: 0 },
        ],
      },
      {
        name: "Emergency Fund",
        percentage: 10,
        amount: 0,
      },
    ],
    defaultAllocation: {
      "High Interest Debt": 50,
      "Medium Interest Debt": 30,
      "Low Interest Debt": 10,
      "Emergency Fund": 10,
    },
    recommendedIncome: {
      min: 40000,
      max: 150000,
    },
    timeline: "36 months",
    tags: ["debt", "financial-freedom", "snowball"],
  },
]
