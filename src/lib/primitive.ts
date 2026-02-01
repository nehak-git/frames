import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

export function cx(...classes: (string | undefined | null | false)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}

export const focusRing = tv({
  base: "outline-hidden focus:outline-hidden forced-colors:outline-1 focus-visible:ring-3 ring-ring/20",
});

export const focusStyles = tv({
  base: "outline-hidden focus:outline-hidden forced-colors:outline-1 focus-visible:ring-3 ring-ring/20",
});

export const focusButtonStyles = tv({
  base: "outline-hidden focus:outline-hidden forced-colors:outline-1 focus-visible:ring-3 ring-ring/20",
});
