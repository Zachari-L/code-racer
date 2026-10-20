// Shared by the theme provider (client) and the root layout (server).

export const THEME_STORAGE_KEY = "coderacer_theme";

/**
 * Runs in <head> before the first paint (see the root layout), so the page
 * never flashes the wrong theme (DES-05). Kept tiny and dependency-free.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
