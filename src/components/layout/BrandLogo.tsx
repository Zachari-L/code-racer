import Image from "next/image";
import wheelLogo from "@/assets/wheel-logo.png";

/**
 * The full Classroom Racer logo (DES-02): the student's wheel stands in for
 * the first "O" of "CLASSROOM", and "RACER" is blue. The letters are text, so
 * they follow the theme. Below 1024 px the two words stack, so the navbar fits
 * down to 360 px (DES-06).
 * The wheel spins when the link is hovered.
 */
export function BrandLogo() {
  return (
    <span
      aria-hidden
      className="flex flex-col items-start text-sm leading-none font-black uppercase sm:text-base lg:flex-row lg:items-center lg:gap-[0.3em] lg:text-3xl lg:tracking-wide"
    >
      <span className="text-slate-dark flex items-center dark:text-white">
        Classr
        <Image
          src={wheelLogo}
          alt=""
          loading="eager"
          // Taller than the capitals: lifted so it sits on the baseline like an "O" instead of hanging below it.
          className="relative -top-[0.1em] mx-px h-[0.95em] w-[0.95em] transition-transform duration-300 group-hover:rotate-180"
        />
        om
      </span>
      <span className="text-azure-blue">Racer</span>
    </span>
  );
}
