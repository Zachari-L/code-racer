import Image from "next/image";
import fullLogo from "@/assets/full-logo.png";

/**
 * The full CodeRacer logo (DES-02). Its letters are dark, so in dark mode it
 * sits on a light tile to stay readable.
 */
export function BrandLogo() {
  return (
    <span className="inline-flex items-center rounded-xl transition-transform duration-200 group-hover:-translate-y-0.5 dark:border-3 dark:border-zinc-700 dark:bg-[#f4f4ed] dark:px-2 dark:py-1">
      <Image
        src={fullLogo}
        alt="CodeRacer"
        loading="eager"
        className="h-6 w-auto sm:h-10 dark:h-5 dark:sm:h-8"
      />
    </span>
  );
}
