import type { Metadata } from "next";
import { Inter, Nunito, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getSiteSettings } from "@/server/site-settings";
import { getLocale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const canonical = locale === "bn" ? "/bn" : "/";
  return {
    title: {
      default: settings.seo.defaultPageTitle,
      template: `%s | ${settings.general.storeName}`,
    },
    description: settings.seo.defaultMetaDescription,
    keywords: settings.seo.defaultKeywords,
    metadataBase: new URL(settings.seo.canonicalSiteUrl || siteUrl),
    alternates: { canonical, languages: { en: "/", bn: "/bn", "x-default": "/" } },
    openGraph: {
      title: settings.general.storeName,
      description: settings.general.tagline,
      images: settings.seo.openGraphImage ? [settings.seo.openGraphImage] : [],
      siteName: settings.general.storeName,
      type: "website",
      url: settings.seo.canonicalSiteUrl || siteUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const locale = await getLocale();
  const canonicalUrl = settings.seo.canonicalSiteUrl || siteUrl;
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${nunito.variable} ${bengali.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: settings.general.storeName,
              url: canonicalUrl,
              logo:
                settings.branding.mainLogo ||
                `${canonicalUrl.replace(/\/$/, "")}/favicon.ico`,
              sameAs: Object.values(settings.social).filter(Boolean),
            }),
          }}
        />
        <AnalyticsScripts />
        <Header />
        <main>{children}</main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
