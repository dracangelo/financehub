/**
 * Navigation structure used by both desktop and mobile navigation
 */
export const navItems = [
  {
    title: "Overview",
    iconName: "Home",
    items: [{ title: "Dashboard", href: "/dashboard", iconName: "BarChart3" }],
  },
  {
    title: "Money Management",
    iconName: "Wallet",
    items: [
      { title: "Accounts", href: "/accounts", iconName: "CreditCard" },
      { title: "Transactions", href: "/transactions", iconName: "Receipt" },
      { title: "Income", href: "/income", iconName: "TrendingUp" },
      { title: "Expenses", href: "/expenses", iconName: "TrendingDown", badge: "New" },
      { title: "Debt Management", href: "/debt-management", iconName: "CreditCard" },
      { title: "Subscriptions", href: "/subscriptions", iconName: "Repeat" },
    ],
  },
  {
    title: "Planning",
    iconName: "Calendar",
    items: [
      { title: "Budgets", href: "/budgets", iconName: "PiggyBank" },
      { title: "Goals", href: "/goals", iconName: "Target" },
      { title: "Bills", href: "/bills", iconName: "FileText" },
      { title: "Tax Planner", href: "/tax-planner", iconName: "Calculator" },
      { title: "Net Worth", href: "/net-worth", iconName: "TrendingUp" },
    ],
  },
  {
    title: "Investments",
    iconName: "TrendingUp",
    items: [
      { title: "Portfolio", href: "/investments/portfolio", iconName: "DollarSign" },
      { title: "ESG Screener", href: "/investments/esg-screener", iconName: "Landmark", badge: "ESG" },
      { title: "Watchlist", href: "/investments/watchlist", iconName: "Clock" },
    ],
  },
  {
    title: "Reports & Analytics",
    iconName: "BarChart3",
    items: [
      { title: "Reports", href: "/reports", iconName: "BarChart3" },
      { title: "Calendar", href: "/calendar", iconName: "Calendar" },
    ],
  },
  {
    title: "Settings",
    iconName: "Settings",
    items: [
      { title: "Settings", href: "/settings", iconName: "Settings" },
      { title: "Notifications", href: "/notifications", iconName: "BellRing" },
    ],
  },
]

/**
 * Creates a return URL parameter for redirects
 * @param path The path to encode as return URL
 * @returns URLSearchParams object with returnUrl parameter
 */
export function createReturnUrlParams(path: string): URLSearchParams {
  return new URLSearchParams({ returnUrl: path })
}
