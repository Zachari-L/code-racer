import { ArcadeBackground } from "@/components/animated/ArcadeBackground";

/** Dot pattern + floating arcade icons. Place inside a `relative` container. */
export function ArcadeBackdrop() {
  return (
    <>
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
    </>
  );
}
