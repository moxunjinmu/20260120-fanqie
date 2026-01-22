export const BUTTON_VARIANTS = {
  primary: "rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glass hover:bg-indigo-700",
  secondary: "rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-glass hover:bg-slate-800",
  outline: "rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-white",
  small: "rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white",
} as const;

export const INPUT_VARIANTS = {
  default: "w-20 rounded-lg border border-slate-200 px-3 py-2 text-right",
  full: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900",
} as const;

export const PANEL_CLASS = "mica-panel";
