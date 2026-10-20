import Image from "next/image";
import { hashString } from "@/lib/game/random";
import { cn } from "@/lib/utils";

const PALETTE = ["#007BFF", "#FF7A00", "#D9008D", "#00BFA5"];

interface AvatarProps {
  /** Stable seed for the generated avatar (member id, user id...). */
  seed: string;
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

/**
 * Profile picture, or a generated 5x5 symmetric pattern for guests and users
 * without a photo (AUTH-03). The pattern only depends on `seed`.
 */
export function Avatar({ seed, name, src, size = 36, className }: AvatarProps) {
  const classes = cn(
    "border-slate-dark shrink-0 overflow-hidden rounded-full border-2 bg-white dark:border-zinc-600",
    className
  );
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className={classes}
        style={{ width: size, height: size }}
      />
    );
  }

  const hash = hashString(seed);
  const color = PALETTE[hash % PALETTE.length];
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if ((hash >>> (y * 3 + x + 2)) & 1) {
        cells.push({ x, y });
        if (x < 2) cells.push({ x: 4 - x, y });
      }
    }
  }
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="-1 -1 7 7"
      width={size}
      height={size}
      className={classes}
    >
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
      ))}
    </svg>
  );
}
