import type { BudgetTemplate } from "@/types/budget"

export const LIFESTYLE_TEMPLATES: BudgetTemplate[] = [
  {
    id: "world-travel",
    name: "World Travel",
    description: "12-month world travel budget",
    type: "zero-based",
    categories: [
      {
        name: "Transportation",
        percentage: 35,
        amount: 0,
        subcategories: [
          { name: "Flights", percentage: 20, amount: 0 },
          { name: "Local Transport", percentage: 10, amount: 0 },
          { name: "Travel Insurance", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Accommodation",
        percentage: 30,
        amount: 0,
        subcategories: [
          { name: "Hotels", percentage: 15, amount: 0 },
          { name: "Hostels", percentage: 10, amount: 0 },
          { name: "Airbnb", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Activities",
        percentage: 20,
        amount: 0,
        subcategories: [
          { name: "Tours", percentage: 10, amount: 0 },
          { name: "Attractions", percentage: 5, amount: 0 },
          { name: "Cultural Events", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Daily Expenses",
        percentage: 15,
        amount: 0,
        subcategories: [
          { name: "Food", percentage: 10, amount: 0 },
          { name: "Miscellaneous", percentage: 5, amount: 0 },
        ],
      },
    ],
    defaultAllocation: {
      "Transportation": 35,
      "Accommodation": 30,
      "Activities": 20,
      "Daily Expenses": 15,
    },
    recommendedIncome: {
      min: 30000,
      max: 100000,
    },
    timeline: "12 months",
    tags: ["travel", "adventure", "lifestyle"],
  },
  {
    id: "sabbatical",
    name: "Career Sabbatical",
    description: "6-month career break planning",
    type: "50-30-20",
    categories: [
      {
        name: "Living Expenses",
        percentage: 50,
        amount: 0,
        subcategories: [
          { name: "Housing", percentage: 30, amount: 0 },
          { name: "Utilities", percentage: 10, amount: 0 },
          { name: "Food", percentage: 10, amount: 0 },
        ],
      },
      {
        name: "Personal Development",
        percentage: 30,
        amount: 0,
        subcategories: [
          { name: "Education", percentage: 15, amount: 0 },
          { name: "Certifications", percentage: 10, amount: 0 },
          { name: "Books & Resources", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Health & Wellness",
        percentage: 10,
        amount: 0,
        subcategories: [
          { name: "Insurance", percentage: 5, amount: 0 },
          { name: "Fitness", percentage: 3, amount: 0 },
          { name: "Mental Health", percentage: 2, amount: 0 },
        ],
      },
      {
        name: "Emergency Fund",
        percentage: 10,
        amount: 0,
      },
    ],
    defaultAllocation: {
      "Living Expenses": 50,
      "Personal Development": 30,
      "Health & Wellness": 10,
      "Emergency Fund": 10,
    },
    recommendedIncome: {
      min: 20000,
      max: 60000,
    },
    timeline: "6 months",
    tags: ["sabbatical", "career-break", "personal-development"],
  },
  {
    id: "digital-nomad",
    name: "Digital Nomad",
    description: "Remote work and travel lifestyle",
    type: "zero-based",
    categories: [
      {
        name: "Work Setup",
        percentage: 20,
        amount: 0,
        subcategories: [
          { name: "Equipment", percentage: 10, amount: 0 },
          { name: "Software", percentage: 5, amount: 0 },
          { name: "Coworking Spaces", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Living Expenses",
        percentage: 40,
        amount: 0,
        subcategories: [
          { name: "Accommodation", percentage: 25, amount: 0 },
          { name: "Food", percentage: 10, amount: 0 },
          { name: "Utilities", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Travel",
        percentage: 25,
        amount: 0,
        subcategories: [
          { name: "Flights", percentage: 15, amount: 0 },
          { name: "Local Transport", percentage: 5, amount: 0 },
          { name: "Visas", percentage: 5, amount: 0 },
        ],
      },
      {
        name: "Insurance & Healthcare",
        percentage: 15,
        amount: 0,
        subcategories: [
          { name: "Health Insurance", percentage: 10, amount: 0 },
          { name: "Travel Insurance", percentage: 5, amount: 0 },
        ],
      },
    ],
    defaultAllocation: {
      "Work Setup": 20,
      "Living Expenses": 40,
      "Travel": 25,
      "Insurance & Healthcare": 15,
    },
    recommendedIncome: {
      min: 40000,
      max: 120000,
    },
    timeline: "12 months",
    tags: ["digital-nomad", "remote-work", "travel"],
  },
]
