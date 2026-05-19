export const title = "MenuNook";
export const description =
  "Create a QR code menu for your place, cafe, salon, or shop in minutes.";

export const linkClasses =
  "text-pink-600 underline-offset-4 hover:text-pink-800 underline";

export const MAX_MENUS_PER_BUSINESS = 10;
export const accordionEaseOut = [0.215, 0.61, 0.355, 1] as const;

export const sortableTransition =
  "transform 250ms cubic-bezier(0.25, 1, 0.5, 1), opacity 180ms ease-out";

export const MENU_SWITCHER_ENTER_TRANSITION = {
  duration: 0.22,
  ease: [0.25, 1, 0.5, 1],
} as const;

export const MENU_SWITCHER_EXIT_TRANSITION = {
  duration: 0.18,
  ease: [0.26, 0.08, 0.25, 1],
} as const;
