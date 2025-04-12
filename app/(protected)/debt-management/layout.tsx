import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Debt Management",
  description: "Take control of your debt with our comprehensive suite of debt management tools.",
}

export default function DebtManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 