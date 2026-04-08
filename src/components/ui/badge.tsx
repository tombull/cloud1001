import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden uppercase tracking-[0.05em]',
  {
    variants: {
      variant: {
        default:
          'bg-primary/10 text-on-surface [a&]:hover:bg-primary/20',
        muted:
          'bg-surface-container-high text-on-surface-variant [a&]:hover:bg-surface-container-highest',
        destructive:
          'bg-error/15 text-error [a&]:hover:bg-error/25',
        outline:
          'border border-outline-variant/20 text-on-surface [a&]:hover:bg-surface-container-high',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
