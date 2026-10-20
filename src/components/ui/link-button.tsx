import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  Omit<VariantProps<typeof buttonVariants>, "pulse"> & { pulse?: boolean };

/** Navigation styled as a button: a real `<a>`, never a button inside a link (A11Y-02). */
export function LinkButton({ className, variant, size, pulse = false, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, pulse }), "arcade-clickable", className)}
      {...props}
    />
  );
}
