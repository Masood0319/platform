import { BRAND_NAME } from "@/config/branding";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 text-sm text-[var(--text-muted)] sm:grid-cols-2 md:grid-cols-3 md:px-6 lg:px-8">
        <div>
          <p className="font-semibold text-[var(--primary)]">{BRAND_NAME}</p>
          <p className="mt-2">Trusted funding network for verified founders and serious investors.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-main)]">Platform</p>
          <p className="mt-2">Discovery</p>
          <p>Matches</p>
          <p>Deals</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-main)]">Compliance</p>
          <p className="mt-2">Verification checks</p>
          <p>Secure document sharing</p>
          <p>Audit-friendly activity logs</p>
        </div>
      </div>
    </footer>
  );
}
