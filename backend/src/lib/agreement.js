// Client-safe helpers (no DB/node-only imports)

export function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  switch (t) {
    case "equity":
    case "musharakah":
      return "equity"; // Musharakah
    case "profit-sharing":
    case "mudarabah":
      return "profit-sharing"; // Mudarabah
    case "safe":
    case "convertible":
      return "safe"; // Convertible SAFE-style
    case "revenue":
    case "revenue-sharing":
      return "revenue-sharing";
    case "crowdfunding":
    case "pool":
      return "crowdfunding";
    default:
      return t;
  }
}

export function buildAgreementPreview({ type, amount, investor, startup, terms }) {
  const t = normalizeType(type);
  const currency = terms?.currency || "USD";
  const lines = [];
  lines.push(`Investment Agreement - ${t.toUpperCase()}`);
  lines.push(`Investor: ${investor?.name || investor?.email || investor?.id || "N/A"}`);
  lines.push(`Startup: ${startup?.name || startup?.id || "N/A"}`);
  lines.push(`Amount: ${currency} ${amount}`);
  switch (t) {
    case "equity":
      lines.push(`Equity Percentage: ${terms?.equityPercent ?? "-"}%`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      break;
    case "profit-sharing":
      lines.push(`Profit Ratio (Investor:Startup): ${terms?.profitRatioInvestor ?? "-"}:${terms?.profitRatioStartup ?? "-"}`);
      lines.push(`Losses borne by Capital Provider only per Mudarabah principles.`);
      break;
    case "safe":
      lines.push(`Conversion: ${terms?.conversion ?? "standard"}`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      lines.push(`Discount: ${terms?.discount ?? 0}%`);
      break;
    case "revenue-sharing":
      lines.push(`Revenue Share: ${terms?.revenueSharePercent ?? "-"}% of gross revenue until ${terms?.returnCapMultiple ?? "-"}x is repaid.`);
      break;
    case "crowdfunding":
      lines.push(`Pool Terms: ${terms?.poolTerms ?? "-"}`);
      lines.push(`Minimum Ticket: ${terms?.minTicket ?? "-"}`);
      break;
    default:
      lines.push(`Custom terms apply.`);
  }
  lines.push("This document is a non-binding preview for review and compliance only.");
  return lines.join("\n");
}
