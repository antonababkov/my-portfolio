import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import { SITE_NAME } from "@/lib/constants";
import { getProfile } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SiteFooter from "@/components/footer/SiteFooter";
import "./globals.scss";
import { SkipLink } from "@/components/ui/SkipLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let title = SITE_NAME;
  let description = SITE_NAME;

  try {
    const profile = await getProfile();
    if (profile) {
      title = profile.siteTitle || SITE_NAME;
      description = profile.siteDescription || SITE_NAME;
    }
  } catch (error) {
    console.error("Failed to load site metadata from DB:", error);
  }

  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: title,
      locale: "ru_RU",
      url: "/",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} app-body`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <SkipLink />
        {children}
        <SiteFooter />
        <div className="theme-toggle-fixed">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}