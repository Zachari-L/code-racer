import { cn } from "@/lib/utils";

interface TireIconProps {
  className?: string;
  size?: number;
  /** Spins when the parent link (`.group`) is hovered. */
  spinOnHover?: boolean;
}

export function TireIcon({ className, size = 28, spinOnHover = true }: TireIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "inline-block shrink-0 transition-transform duration-300",
        spinOnHover && "group-hover:rotate-180",
        className
      )}
    >
      {/* Outer tire tread (Dark Slate) */}
      <circle cx="50" cy="50" r="46" fill="#111112" stroke="#111112" strokeWidth="4" />

      {/* Tire tread grooves */}
      <path d="M 50 4 L 50 14" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 50 86 L 50 96" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 4 50 L 14 50" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 86 50 L 96 50" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 18 18 L 25 25" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 82 82 L 75 75" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 82 18 L 75 25" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 18 82 L 25 75" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />

      {/* Rim (Electric Lime / Azure Accent) */}
      <circle cx="50" cy="50" r="30" fill="#d2ff00" stroke="#111112" strokeWidth="4" />

      {/* Inner hub */}
      <circle cx="50" cy="50" r="14" fill="#007BFF" stroke="#111112" strokeWidth="3" />

      {/* Center lug nut */}
      <circle cx="50" cy="50" r="5" fill="#111112" />
    </svg>
  );
}
