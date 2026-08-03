// Deprecated raw-collection accessors kept only as hard-fail guards.
// All database access must go through Mongoose models.
function deprecatedAccessor(name) {
  throw new Error(`${name} is deprecated. Use Mongoose models instead.`);
}

export async function getInvestorsCollection() {
  return deprecatedAccessor("getInvestorsCollection");
}

export async function getStartupsCollection() {
  return deprecatedAccessor("getStartupsCollection");
}

export async function getInvestmentsCollection() {
  return deprecatedAccessor("getInvestmentsCollection");
}

export async function getContractsCollection() {
  return deprecatedAccessor("getContractsCollection");
}

export async function getMessagesCollection() {
  return deprecatedAccessor("getMessagesCollection");
}

export async function getUsersCollection() {
  return deprecatedAccessor("getUsersCollection");
}

export const HARAM_INDUSTRIES = [
  "alcohol",
  "gambling",
  "pork",
  "adult",
  "tobacco",
  "conventional_finance_interest",
  "cannabis_non_medicinal",
];

export function hasProhibitedTerms(terms = {}) {
  const forbiddenKeys = [
    "interest",
    "interestRate",
    "guaranteedReturn",
    "fixedReturn",
    "apr",
  ];
  for (const key of forbiddenKeys) {
    if (terms[key] != null) return true;
  }

  const json = JSON.stringify(terms).toLowerCase();
  return (
    json.includes("interest") ||
    json.includes("fixed return") ||
    json.includes("guaranteed")
  );
}

export function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  switch (t) {
    case "equity":
    case "musharakah":
      return "equity";
    case "profit-sharing":
    case "mudarabah":
      return "profit-sharing";
    case "safe":
    case "convertible":
      return "safe";
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

export function buildAgreementPreview({
  type,
  amount,
  investor,
  startup,
  terms,
}) {
  const t = normalizeType(type);
  const currency = terms?.currency || "USD";
  const lines = [];
  lines.push(`Investment Agreement - ${t.toUpperCase()}`);
  lines.push(
    `Investor: ${investor?.name || investor?.email || investor?.id || "N/A"}`,
  );
  lines.push(`Startup: ${startup?.name || startup?.id || "N/A"}`);
  lines.push(`Amount: ${currency} ${amount}`);

  switch (t) {
    case "equity":
      lines.push(`Equity Percentage: ${terms?.equityPercent ?? "-"}%`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      break;
    case "profit-sharing":
      lines.push(
        `Profit Ratio (Investor:Startup): ${terms?.profitRatioInvestor ?? "-"}:${terms?.profitRatioStartup ?? "-"}`,
      );
      lines.push(
        "Losses borne by Capital Provider only per Mudarabah principles.",
      );
      break;
    case "safe":
      lines.push(`Conversion: ${terms?.conversion ?? "standard"}`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      lines.push(`Discount: ${terms?.discount ?? 0}%`);
      break;
    case "revenue-sharing":
      lines.push(
        `Revenue Share: ${terms?.revenueSharePercent ?? "-"}% of gross revenue until ${terms?.returnCapMultiple ?? "-"}x is repaid.`,
      );
      break;
    case "crowdfunding":
      lines.push(`Pool Terms: ${terms?.poolTerms ?? "-"}`);
      lines.push(`Minimum Ticket: ${terms?.minTicket ?? "-"}`);
      break;
    default:
      lines.push("Custom terms apply.");
  }

  lines.push(
    "This document is a non-binding preview for review and compliance only.",
  );
  return lines.join("\n");
}
