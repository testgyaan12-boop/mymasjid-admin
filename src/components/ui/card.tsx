import * as React from "react"
import { cn } from "@/lib/utils"

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-2xl border border-[#E2E8F0] bg-white shadow-card transition-shadow duration-200 dark:bg-[#1a1f2e] dark:border-[#2a3042]", className)} {...props} />
))
Card.displayName = "Card"

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 px-6 pt-5 pb-3", className)} {...props} />
)

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold text-[15px] text-[#0F172A] dark:text-[#E2E8F0] tracking-tight", className)} {...props} />
)

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 pb-5 pt-0", className)} {...props} />
)
