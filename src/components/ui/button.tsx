import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  capitalize?: boolean;
}

const buttonVariants = cva(
  "inline-flex hover:cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background font-medium hover:opacity-90 active:scale-[0.98] [box-shadow:inset_0_1px_0_oklch(100%_0_0_/_0.1),0_2px_4px_oklch(0%_0_0_/_0.2),0_1px_2px_oklch(0%_0_0_/_0.12)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:scale-[0.98] focus-visible:ring-destructive/20 [box-shadow:inset_0_1px_0_oklch(100%_0_0_/_0.08),0_2px_4px_oklch(0%_0_0_/_0.15)]",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-background-2 active:scale-[0.98]",
        secondary:
          "bg-background-2 border border-border text-foreground hover:bg-background-3 active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-background-2 active:scale-[0.98]",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ className, variant, size, asChild = false, capitalize, ...props }: Props) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
