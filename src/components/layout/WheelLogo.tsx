import Image from "next/image";
import { cn } from "@/lib/utils";
import wheelLogo from "@/assets/wheel-logo.png";

interface WheelLogoProps {
  className?: string;
  size?: number;
}

/** The CodeRacer wheel (DES-02). Spins when the parent link (`.group`) is hovered. */
export function WheelLogo({ className, size = 32 }: WheelLogoProps) {
  return (
    <Image
      src={wheelLogo}
      alt=""
      width={size}
      height={size}
      loading="eager"
      className={cn(
        "inline-block shrink-0 transition-transform duration-300 group-hover:rotate-180",
        className
      )}
    />
  );
}
