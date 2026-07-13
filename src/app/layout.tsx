import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "KhelaGhor | Play. Learn. Grow Together.",
    template: "%s | KhelaGhor",
  },
  description:
    "A premium children’s eCommerce platform for Bangladesh selling toys, books, clothing, baby care, school supplies and gifts.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    title: "KhelaGhor",
    description: "Khela • Hasi • Shikha",
    siteName: "KhelaGhor",
    type: "website",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "KhelaGhor",
              url: siteUrl,
              logo: `${siteUrl.replace(/\/$/, "")}/favicon.ico`,
              sameAs: [],
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
