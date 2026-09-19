import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bishal Sales CRM",
    template: "%s · Bishal Sales CRM",
  },
  description:
    "Enterprise-grade B2B sales CRM for trading companies, distributors and hospitality suppliers.",
  applicationName: "Bishal Sales CRM",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Bishal CRM" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

/**
 * Applies the saved accent theme before first paint so there's no flash
 * of the default palette on load.
 */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    document.documentElement.setAttribute('data-theme', t || '${DEFAULT_THEME}');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
