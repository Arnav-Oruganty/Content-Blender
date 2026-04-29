export const BLOCK_TYPES = [
  { type: "title",     label: "Title",      icon: "T", colorClass: "type-title"   },
  { type: "section",   label: "Section",    icon: "§", colorClass: "type-section" },
  { type: "paragraph", label: "Paragraph",  icon: "¶", colorClass: "type-para"    },
  { type: "image",     label: "Image",      icon: "▣", colorClass: "type-image"   },
  { type: "quote",     label: "Quote",      icon: '"', colorClass: "type-quote"   },
  { type: "list",      label: "List",       icon: "≡", colorClass: "type-list"    },
  { type: "hero",      label: "Hero",       icon: "H", colorClass: "type-hero"    },
  { type: "card",      label: "Card grid",  icon: "▦", colorClass: "type-card"    },
  { type: "row",       label: "Row",        icon: "⇆", colorClass: "type-row"     },
];

export const BLOCK_GROUPS = [
  { label: "Typography", types: ["title", "section", "paragraph"] },
  { label: "Media",      types: ["image", "hero"] },
  { label: "Content",    types: ["quote", "list", "card"] },
  { label: "Layout",     types: ["row"] },
];

// ── Image Block Metadata Schema ────────────────────────────────────────────
export function getImageMetadataSchema() {
  return {
    sourceType: "url",  // "url" or "local"
    url: "",
    altText: "",
    caption: "",
  };
}

// ── Row Container Schema ─────────────────────────────────────────────────────
export function getRowSchema(columnCount = 2) {
  return {
    type: "row",
    layout: "horizontal",
    columns: columnCount,
    children: [],
    gap: "16px",
    width: "100%",
  };
}

export const LAYOUTS = [
  {
    id:   "article",
    name: "Editorial Article",
    desc: "Title · pull quote · sections",
    emoji: "📰",
    accent: "#4F46E5",
    blocks: [
      { type: "hero",      content: "The Big Story\nIn-depth analysis and perspective" },
      { type: "section",   content: "Opening" },
      { type: "paragraph", content: "Set the scene here. Hook the reader with a compelling first paragraph that draws them into the narrative." },
      { type: "quote",     content: "The most important thing is not to stop questioning. Curiosity has its own reason for existing." },
      { type: "section",   content: "The Details" },
      { type: "paragraph", content: "Expand on your main argument. Provide evidence, examples, and analysis that support your thesis." },
      { type: "list",      content: "", items: ["Key insight one", "Key insight two", "Key insight three"] },
      { type: "section",   content: "Takeaway" },
      { type: "paragraph", content: "Wrap up with your conclusion and what the reader should do or think differently about." },
    ],
  },
  {
    id:   "landing",
    name: "Product Landing",
    desc: "Hero · features · CTA",
    emoji: "🚀",
    accent: "#059669",
    blocks: [
      { type: "hero",      content: "Build Something Amazing\nThe fastest way to ship your ideas" },
      { type: "section",   content: "Why it works" },
      { type: "card",      content: "", items: ["⚡ Blazing fast", "🔒 Secure by default", "📦 Zero config", "🌍 Global CDN"] },
      { type: "section",   content: "How it works" },
      { type: "paragraph", content: "Three simple steps. Sign up in seconds, drop in your content, and go live instantly. No credit card required." },
      { type: "list",      content: "", items: ["Create your account", "Add your content blocks", "Publish to the world"] },
      { type: "quote",     content: "We shipped our entire documentation site in under an hour. Absolutely game-changing." },
      { type: "section",   content: "Get started today" },
      { type: "paragraph", content: "Join thousands of teams already using Content Blender to build faster." },
    ],
  },
  {
    id:   "report",
    name: "Research Report",
    desc: "Executive summary · findings · data",
    emoji: "📊",
    accent: "#D97706",
    blocks: [
      { type: "title",     content: "Q4 2025 Research Report" },
      { type: "paragraph", content: "Prepared by the Research Division · December 2025" },
      { type: "section",   content: "Executive Summary" },
      { type: "paragraph", content: "This report presents key findings from our Q4 analysis. Overall performance exceeded projections by 14%, driven primarily by organic growth in the APAC region." },
      { type: "section",   content: "Key Findings" },
      { type: "list",      content: "", items: ["Revenue up 14% YoY", "Customer retention at 94%", "NPS score improved to 72", "New markets: 3 opened"] },
      { type: "section",   content: "Methodology" },
      { type: "paragraph", content: "Data was collected across 12 markets between October and December 2025. Sample size: n=4,200 respondents. Confidence interval: 95%." },
      { type: "quote",     content: "The data signals a clear inflection point — this is the strongest position we have been in since 2019." },
      { type: "section",   content: "Recommendations" },
      { type: "paragraph", content: "Based on these findings, the team recommends doubling investment in the APAC region and accelerating the product roadmap for Q1." },
    ],
  },
  {
    id:   "newsletter",
    name: "Newsletter",
    desc: "Header · stories · sign-off",
    emoji: "💌",
    accent: "#7C3AED",
    blocks: [
      { type: "hero",      content: "The Weekly Digest\nIssue #42 · What's new this week" },
      { type: "section",   content: "This week's highlight" },
      { type: "paragraph", content: "Welcome back, readers. This week we're covering the most interesting developments across technology, design, and culture." },
      { type: "image",     content: "weekly-cover.jpg" },
      { type: "section",   content: "Top stories" },
      { type: "card",      content: "", items: ["AI breakthroughs in medicine", "The new design systems era", "Open source won", "What's next for the web"] },
      { type: "section",   content: "Quote of the week" },
      { type: "quote",     content: "Simplicity is the ultimate sophistication. The best interfaces are the ones you don't notice." },
      { type: "section",   content: "Until next week" },
      { type: "paragraph", content: "That's all for this edition. If you found this valuable, forward it to someone who'd enjoy it. See you next week." },
    ],
  },
  {
    id:   "casestudy",
    name: "Case Study",
    desc: "Challenge · solution · results",
    emoji: "🏆",
    accent: "#DC2626",
    blocks: [
      { type: "hero",      content: "How Acme Co. 10x'd Their Conversion\nA deep-dive into product-led growth" },
      { type: "section",   content: "The Challenge" },
      { type: "paragraph", content: "Acme Co. was struggling with a 2.3% conversion rate and high churn. The onboarding flow was confusing, and users were dropping off before experiencing the core value." },
      { type: "section",   content: "The Approach" },
      { type: "list",      content: "", items: ["Mapped the full user journey", "Identified 3 critical drop-off points", "Redesigned onboarding in 2 weeks", "A/B tested 6 variants"] },
      { type: "section",   content: "The Solution" },
      { type: "paragraph", content: "We rebuilt the onboarding from scratch using a jobs-to-be-done framework. Every step was tied to a clear user outcome, not a product feature." },
      { type: "image",     content: "solution-diagram.jpg" },
      { type: "section",   content: "The Results" },
      { type: "card",      content: "", items: ["📈 Conversion: 2.3% → 23%", "📉 Churn: -61%", "⏱ Time-to-value: -40%", "⭐ NPS: +44 points"] },
      { type: "quote",     content: "This was the highest-impact project we've run in three years. The results speak for themselves." },
    ],
  },
  {
    id:   "minimal",
    name: "Minimal Doc",
    desc: "Clean prose, nothing extra",
    emoji: "✦",
    accent: "#6B7280",
    blocks: [
      { type: "title",     content: "Untitled Document" },
      { type: "paragraph", content: "Begin writing here. This template keeps everything clean and focused — just your content, nothing else." },
    ],
  },
];

export function getBlockMeta(type) {
  return (
    BLOCK_TYPES.find((b) => b.type === type) || {
      type,
      label: type,
      icon: "B",
      colorClass: "type-para",
    }
  );
}

export function uid() {
  return "u" + Math.random().toString(36).slice(2, 9);
}

// ── Helper: Create a new row block ─────────────────────────────────────────
export function createRowBlock(columns = 2) {
  return {
    uid: uid(),
    ref: uid(),
    type: "row",
    layout: "horizontal",
    columns,
    children: [],
    gap: "16px",
    width: "100%",
    containerType: "row",
  };
}

// ── Helper: Create a new image block with metadata ──────────────────────────
export function createImageBlock(imageUrl = "", altText = "") {
  return {
    uid: uid(),
    ref: uid(),
    type: "image",
    content: altText,
    sourceType: "url",
    url: imageUrl,
    altText: altText,
    caption: "",
    containerType: null,
  };
}

// ── Helper: Create a standard block ────────────────────────────────────────
export function createBlock(type, content = "", items = []) {
  return {
    uid: uid(),
    ref: uid(),
    type,
    content,
    items,
    containerType: null,
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
