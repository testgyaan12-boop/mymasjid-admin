import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[10px] text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-700",
        indigo: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-700",
        outline: "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] dark:border-[#2a3042] dark:bg-[#1a1f2e] dark:text-[#E2E8F0] dark:hover:bg-[#222838] dark:hover:border-[#3a4052]",
        ghost: "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-white/5 dark:hover:text-white",
        destructive: "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-700",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
))
Button.displayName = "Button"
