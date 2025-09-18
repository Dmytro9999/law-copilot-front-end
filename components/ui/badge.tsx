import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-slate-900 text-white',
				secondary: 'border-transparent bg-slate-100 text-slate-900',
				outline: 'text-slate-700 border-slate-200',
				success: 'bg-green-100 text-green-800 border-green-200',
				warning: 'bg-amber-100 text-amber-800 border-amber-200',
				destructive: 'bg-red-100 text-red-800 border-red-200',
				info: 'bg-blue-100 text-blue-800 border-blue-200',
				purple: 'bg-purple-100 text-purple-800 border-purple-200',
			},
			size: {
				sm: 'text-xs',
				md: 'text-sm',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'sm',
		},
	}
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

export default function Badge({ className, variant, size, ...props }: BadgeProps) {
	return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
