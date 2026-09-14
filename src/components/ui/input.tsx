import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150 dark:border-[#2a3042] dark:bg-[#141925] dark:text-[#E2E8F0] dark:placeholder:text-[#64748B] dark:focus:ring-blue-500/20 dark:focus:border-blue-500",
      className
    )}
    {...props}
  />
))
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150 resize-none dark:border-[#2a3042] dark:bg-[#141925] dark:text-[#E2E8F0] dark:placeholder:text-[#64748B] dark:focus:ring-blue-500/20 dark:focus:border-blue-500",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-[13px] font-medium text-[#374151] dark:text-[#CBD5E1]", className)} {...props} />
)
