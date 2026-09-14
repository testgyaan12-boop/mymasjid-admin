import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline'
}

const variantClasses: Record<string, string> = {
  default: "bg-[#F1F5F9] text-[#64748B] border-transparent dark:bg-white/10 dark:text-[#94A3B8]",
  success: "bg-[#D1FAE5] text-[#059669] border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-[#FEF3C7] text-[#D97706] border-transparent dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-[#FEE2E2] text-[#DC2626] border-transparent dark:bg-red-900/30 dark:text-red-400",
  info: "bg-[#DBEAFE] text-[#2563EB] border-transparent dark:bg-blue-900/30 dark:text-blue-400",
  purple: "bg-[#EDE9FE] text-[#7C3AED] border-transparent dark:bg-purple-900/30 dark:text-purple-400",
  outline: "bg-transparent text-[#64748B] border-[#E2E8F0] dark:text-[#94A3B8] dark:border-[#2a3042]",
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border leading-tight",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
