export type SymbolTab = "math" | "greek" | "index";

/** «Belgilar» oynasi: oddiy matnga qo'yiladigan Unicode belgilari. */
export const SYMBOLS: Record<SymbolTab, readonly string[]> = {
  math: [
    "±", "×", "÷", "√", "∛", "π", "∞", "≈", "≠", "≤", "≥", "<", ">", "∑", "∏", "∫", "∂", "∆", "∈", "∉", "∪", "∩", "⊂", "⊆", "∅",
    "⇒", "⇔", "∠", "⊥", "∥", "°", "′", "″", "‰", "½", "¼", "¾", "→", "←", "↑", "↓", "∀", "∃", "∴", "∵", "ℝ", "ℤ",
  ],
  greek: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "π", "ρ", "σ", "τ", "φ", "χ", "ψ", "ω", "Δ", "Σ", "Ω", "Φ", "Ψ", "Γ", "Θ", "Λ"],
  index: [
    "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁺", "⁻", "₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₊", "₋",
  ],
};

/** Formula oynasidagi tayyor formulalar (LaTeX). `key` — i18n kaliti. */
export const FORMULA_GALLERY: ReadonlyArray<{ key: string; latex: string }> = [
  { key: "fraction", latex: "\\frac{a}{b}" },
  { key: "sqrt", latex: "\\sqrt{x}" },
  { key: "power", latex: "x^{2}" },
  { key: "index", latex: "x_{1}" },
  { key: "quadratic", latex: "ax^2+bx+c=0" },
  { key: "roots", latex: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}" },
  { key: "discriminant", latex: "D=b^2-4ac" },
  { key: "pythagoras", latex: "a^2+b^2=c^2" },
  { key: "circle", latex: "S=\\pi r^2" },
  { key: "integral", latex: "\\int_a^b f(x)\\,dx" },
  { key: "sum", latex: "\\sum_{i=1}^{n} a_i" },
  { key: "limit", latex: "\\lim_{x\\to\\infty}\\frac{1}{x}=0" },
  { key: "log", latex: "\\log_a b" },
  { key: "trig", latex: "\\sin^2x+\\cos^2x=1" },
  { key: "percent", latex: "\\frac{a}{b}\\cdot100\\%" },
];

/** Formula maydoniga qo'yiladigan shablonlar (`#@` — belgilangan joy, `#?` — to'ldiriladigan joy). */
export const FORMULA_TEMPLATES: ReadonlyArray<{ key: string; latex: string }> = [
  { key: "fraction", latex: "\\frac{#@}{#?}" },
  { key: "root", latex: "\\sqrt{#@}" },
  { key: "power", latex: "#@^{#?}" },
  { key: "index", latex: "#@_{#?}" },
  { key: "integral", latex: "\\int_{#?}^{#?}#@" },
  { key: "sum", latex: "\\sum_{#?}^{#?}#@" },
  { key: "limit", latex: "\\lim_{#?\\to#?}" },
];

export const TEXT_COLORS = ["#16172f", "#7478a0", "#9a6a3a", "#e0791f", "#d99a14", "#2c9a78", "#4567f5", "#7c55ea", "#d9468f", "#e5484d"] as const;
export const HIGHLIGHT_COLORS = ["#f1f3f6", "#f3e7da", "#fde5cf", "#fdefcf", "#cdebdf", "#dde4fe", "#e8e0ff", "#fbd5e8", "#fbd5d5"] as const;
export const CELL_COLORS = HIGHLIGHT_COLORS;
export const FONT_FAMILIES = [
  { key: "default", value: "" },
  { key: "serif", value: "Georgia, serif" },
  { key: "mono", value: "ui-monospace, Menlo, monospace" },
  { key: "hand", value: '"Bradley Hand","Segoe Script",cursive' },
] as const;
export const FONT_SIZES = [
  { key: "small", value: "13px" },
  { key: "normal", value: "" },
  { key: "large", value: "20px" },
  { key: "huge", value: "28px" },
] as const;
