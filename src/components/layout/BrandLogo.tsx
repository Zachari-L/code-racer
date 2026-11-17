import Image from "next/image";
import wheelLogo from "@/assets/wheel-logo.png";

/**
 * The full CodeRacer logo (DES-02), laid out as in the student's sketch: the
 * wheel stands in for the "O" of "CODE", and "RACER" is blue. The letters are
 * text, so they follow the theme. The wheel spins when the link is hovered.
 */
export function BrandLogo() {
  return (
    <span
      aria-hidden
      className="flex items-center text-base leading-none font-black uppercase sm:text-3xl sm:tracking-wide"
    >
      <span className="text-slate-dark dark:text-white">C</span>
      <Image
        src={wheelLogo}
        alt=""
        loading="eager"
        // Taller than the capitals: lifted so it sits on the baseline like an "O" instead of hanging below it.
        className="relative -top-[0.1em] mx-px h-[0.95em] w-[0.95em] transition-transform duration-300 group-hover:rotate-180"
      />
      <span className="text-slate-dark dark:text-white">de</span>
      <span className="text-azure-blue">Racer</span>
    </span>
  );
}
