import "./globals.css";
import { ToastHost } from "@/components/ui/toast-host";
import { RouteProgress } from "@/components/ui/route-progress";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { UserProvider } from "@/components/providers/UserProvider";
import { UnreadProvider } from "@/components/providers/UnreadProvider";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TITLE } from "@/config/branding";
import { Suspense } from "react";

export const metadata = {
  title: BRAND_TITLE,
  description: BRAND_DESCRIPTION,
  keywords: [
    "Fundraise",
    "founder investor platform",
    "startup funding",
    "venture capital",
    "raise capital",
  ],
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <UserProvider>
          <SocketProvider>
            <UnreadProvider>
              {children}
            </UnreadProvider>
          </SocketProvider>
        </UserProvider>
        <ToastHost />
      </body>
    </html>
  );
}