"use client";

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";
import { cx } from "@/lib/primitive";

export const buttonStyles = tv({
  base: [
    "relative isolate inline-flex items-center justify-center font-medium",
    "rounded-lg border transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  variants: {
    intent: {
      primary: "bg-primary text-primary-fg border-primary hover:bg-primary/90",
      secondary:
        "bg-secondary text-secondary-fg border-border hover:bg-secondary/80",
      danger: "bg-danger text-danger-fg border-danger hover:bg-danger/90",
      outline:
        "bg-transparent text-fg border-border hover:bg-secondary",
      ghost: "bg-transparent text-fg border-transparent hover:bg-secondary",
    },
    size: {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends ButtonPrimitiveProps,
    VariantProps<typeof buttonStyles> {}

export function Button({ className, intent, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      {...props}
      className={(renderProps) =>
        cx(
          buttonStyles({ intent, size }),
          typeof className === "function" ? className(renderProps) : className
        )
      }
    />
  );
}
