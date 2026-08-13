import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import { LedgerProvider } from "@/context/LedgerContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";
import { ToastHost } from "@/components/ui/ToastHost";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Giver — Who you dey dash pass?",
  description:
    "Upload your bank Excel or CSV statement and see who you give the most — and who gives you the most. Funny Pidgin rankings and share cards. Got PDF? Convert to Excel at https://www.ilovepdf.com/pdf_to_excel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#070708",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full overflow-x-clip antialiased`}
    >
      <body className="min-h-full w-full max-w-[100vw] overflow-x-clip">
        <ToastProvider>
          <LedgerProvider>
            <AppShell>{children}</AppShell>
            <ToastHost />
          </LedgerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
