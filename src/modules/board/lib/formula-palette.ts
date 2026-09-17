export interface FormulaTemplate {
  insert: string;
  preview: string;
}

export interface FormulaGroup {
  id: string;
  items: FormulaTemplate[];
}

const BOX = "\\square";

function symbol(latex: string): FormulaTemplate {
  return { insert: latex, preview: latex };
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: "fraction",
    items: [
      { insert: "\\frac{#0}{#?}", preview: `\\frac{${BOX}}{${BOX}}` },
      { insert: "{#0}/{#?}", preview: `${BOX}/${BOX}` },
      { insert: "\\frac{d#0}{d#?}", preview: `\\frac{d${BOX}}{d${BOX}}` },
      { insert: "\\binom{#0}{#?}", preview: `\\binom{${BOX}}{${BOX}}` },
    ],
  },
  {
    id: "script",
    items: [
      { insert: "#0^{#?}", preview: `${BOX}^{${BOX}}` },
      { insert: "#0_{#?}", preview: `${BOX}_{${BOX}}` },
      { insert: "#0_{#?}^{#?}", preview: `${BOX}_{${BOX}}^{${BOX}}` },
      { insert: "{}_{#?}^{#?}#0", preview: `{}_{${BOX}}^{${BOX}}${BOX}` },
      { insert: "x^{2}", preview: "x^{2}" },
      { insert: "e^{#?}", preview: `e^{${BOX}}` },
    ],
  },
  {
    id: "radical",
    items: [
      { insert: "\\sqrt{#0}", preview: `\\sqrt{${BOX}}` },
      { insert: "\\sqrt[#?]{#0}", preview: `\\sqrt[${BOX}]{${BOX}}` },
      { insert: "\\sqrt[3]{#0}", preview: `\\sqrt[3]{${BOX}}` },
      { insert: "\\sqrt{#?^{2}+#?^{2}}", preview: "\\sqrt{a^{2}+b^{2}}" },
    ],
  },
  {
    id: "integral",
    items: [
      { insert: "\\int #0\\,d#?", preview: `\\int ${BOX}\\,dx` },
      { insert: "\\int_{#?}^{#?} #0\\,d#?", preview: `\\int_{${BOX}}^{${BOX}} ${BOX}\\,dx` },
      { insert: "\\iint #0", preview: `\\iint ${BOX}` },
      { insert: "\\iiint #0", preview: `\\iiint ${BOX}` },
      { insert: "\\oint #0", preview: `\\oint ${BOX}` },
    ],
  },
  {
    id: "largeOperator",
    items: [
      { insert: "\\sum_{#?}^{#?} #0", preview: `\\sum_{${BOX}}^{${BOX}} ${BOX}` },
      { insert: "\\sum_{i=1}^{n} #0", preview: "\\sum_{i=1}^{n} x_i" },
      { insert: "\\prod_{#?}^{#?} #0", preview: `\\prod_{${BOX}}^{${BOX}} ${BOX}` },
      { insert: "\\bigcup_{#?} #0", preview: `\\bigcup_{${BOX}} ${BOX}` },
      { insert: "\\bigcap_{#?} #0", preview: `\\bigcap_{${BOX}} ${BOX}` },
    ],
  },
  {
    id: "bracket",
    items: [
      { insert: "\\left(#0\\right)", preview: `\\left(${BOX}\\right)` },
      { insert: "\\left[#0\\right]", preview: `\\left[${BOX}\\right]` },
      { insert: "\\left\\lbrace #0\\right\\rbrace", preview: `\\left\\lbrace ${BOX}\\right\\rbrace` },
      { insert: "\\left|#0\\right|", preview: `\\left|${BOX}\\right|` },
      { insert: "\\left\\lVert #0\\right\\rVert", preview: `\\left\\lVert ${BOX}\\right\\rVert` },
      { insert: "\\left\\langle #0\\right\\rangle", preview: `\\left\\langle ${BOX}\\right\\rangle` },
      {
        insert: "\\begin{cases}#0 & #?\\\\ #? & #?\\end{cases}",
        preview: `\\begin{cases}${BOX} & ${BOX}\\\\ ${BOX} & ${BOX}\\end{cases}`,
      },
    ],
  },
  {
    id: "function",
    items: [
      { insert: "\\sin #0", preview: "\\sin x" },
      { insert: "\\cos #0", preview: "\\cos x" },
      { insert: "\\tan #0", preview: "\\tan x" },
      { insert: "\\cot #0", preview: "\\cot x" },
      { insert: "\\arcsin #0", preview: "\\arcsin x" },
      { insert: "\\arccos #0", preview: "\\arccos x" },
      { insert: "\\ln #0", preview: "\\ln x" },
      { insert: "\\lg #0", preview: "\\lg x" },
      { insert: "f\\left(#0\\right)", preview: "f(x)" },
    ],
  },
  {
    id: "accent",
    items: [
      { insert: "\\vec{#0}", preview: `\\vec{${BOX}}` },
      { insert: "\\overrightarrow{#0}", preview: "\\overrightarrow{AB}" },
      { insert: "\\hat{#0}", preview: `\\hat{${BOX}}` },
      { insert: "\\bar{#0}", preview: `\\bar{${BOX}}` },
      { insert: "\\overline{#0}", preview: "\\overline{AB}" },
      { insert: "\\dot{#0}", preview: `\\dot{${BOX}}` },
      { insert: "\\ddot{#0}", preview: `\\ddot{${BOX}}` },
      { insert: "\\tilde{#0}", preview: `\\tilde{${BOX}}` },
    ],
  },
  {
    id: "limit",
    items: [
      { insert: "\\lim_{#?\\to #?} #0", preview: `\\lim_{${BOX}\\to ${BOX}} ${BOX}` },
      { insert: "\\lim_{n\\to\\infty} #0", preview: "\\lim_{n\\to\\infty} a_n" },
      { insert: "\\lim_{x\\to 0} #0", preview: "\\lim_{x\\to 0} f(x)" },
      { insert: "\\log_{#?} #0", preview: `\\log_{${BOX}} ${BOX}` },
      { insert: "\\max_{#?} #0", preview: `\\max_{${BOX}} ${BOX}` },
      { insert: "\\min_{#?} #0", preview: `\\min_{${BOX}} ${BOX}` },
    ],
  },
  {
    id: "operator",
    items: [
      symbol("\\to"),
      symbol("\\gets"),
      symbol("\\Rightarrow"),
      symbol("\\Leftarrow"),
      symbol("\\Leftrightarrow"),
      symbol("\\rightleftharpoons"),
      { insert: "\\xrightarrow{#?}", preview: `\\xrightarrow{${BOX}}` },
      { insert: "\\overset{#?}{#0}", preview: `\\overset{${BOX}}{${BOX}}` },
      { insert: "\\underset{#?}{#0}", preview: `\\underset{${BOX}}{${BOX}}` },
    ],
  },
  {
    id: "matrix",
    items: [
      {
        insert: "\\begin{pmatrix}#0 & #?\\\\ #? & #?\\end{pmatrix}",
        preview: `\\begin{pmatrix}${BOX} & ${BOX}\\\\ ${BOX} & ${BOX}\\end{pmatrix}`,
      },
      {
        insert: "\\begin{bmatrix}#0 & #?\\\\ #? & #?\\end{bmatrix}",
        preview: `\\begin{bmatrix}${BOX} & ${BOX}\\\\ ${BOX} & ${BOX}\\end{bmatrix}`,
      },
      {
        insert: "\\begin{vmatrix}#0 & #?\\\\ #? & #?\\end{vmatrix}",
        preview: `\\begin{vmatrix}${BOX} & ${BOX}\\\\ ${BOX} & ${BOX}\\end{vmatrix}`,
      },
      {
        insert: "\\begin{pmatrix}#0 & #? & #?\\\\ #? & #? & #?\\\\ #? & #? & #?\\end{pmatrix}",
        preview: "\\begin{pmatrix}a & b & c\\\\ d & e & f\\\\ g & h & i\\end{pmatrix}",
      },
      {
        insert: "\\begin{pmatrix}#0\\\\ #?\\end{pmatrix}",
        preview: `\\begin{pmatrix}${BOX}\\\\ ${BOX}\\end{pmatrix}`,
      },
    ],
  },
  {
    id: "symbol",
    items: [
      "\\pm", "\\mp", "\\infty", "=", "\\ne", "\\approx", "\\equiv", "\\sim", "\\propto",
      "\\times", "\\div", "\\cdot", "<", ">", "\\le", "\\ge", "\\ll", "\\gg",
      "\\forall", "\\exists", "\\nexists", "\\in", "\\notin", "\\ni", "\\subset", "\\subseteq",
      "\\cup", "\\cap", "\\emptyset", "\\partial", "\\nabla", "\\Delta", "\\degree", "\\%",
      "\\angle", "\\perp", "\\parallel", "\\triangle", "\\therefore", "\\because",
      "\\alpha", "\\beta", "\\gamma", "\\delta", "\\varepsilon", "\\theta", "\\lambda", "\\mu",
      "\\pi", "\\rho", "\\sigma", "\\tau", "\\varphi", "\\omega", "\\Omega", "\\Sigma",
    ].map(symbol),
  },
  {
    id: "chemistry",
    items: [
      { insert: "\\mathrm{#0}_{#?}", preview: `\\mathrm{${BOX}}_{${BOX}}` },
      { insert: "\\mathrm{#0}^{#?+}", preview: `\\mathrm{${BOX}}^{${BOX}+}` },
      { insert: "\\mathrm{#0}^{#?-}", preview: `\\mathrm{${BOX}}^{${BOX}-}` },
      { insert: "\\mathrm{H_2O}", preview: "\\mathrm{H_2O}" },
      { insert: "\\mathrm{H_2SO_4}", preview: "\\mathrm{H_2SO_4}" },
      { insert: "\\mathrm{CO_2}", preview: "\\mathrm{CO_2}" },
      { insert: "\\xrightarrow{t^{\\circ}}", preview: "\\xrightarrow{t^{\\circ}}" },
      { insert: "\\xrightarrow{#?}", preview: `\\xrightarrow{${BOX}}` },
      symbol("\\rightleftharpoons"),
      symbol("\\uparrow"),
      symbol("\\downarrow"),
    ],
  },
];
