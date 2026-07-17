import type { MetadataRoute } from "next";
import { blogPosts, categories, products } from "@/data/catalog";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const paths = [
    "/",
    "/shop",
    "/categories",
    "/brands",
    "/blog",
    "/about-us",
    "/contact-us",
  ]
    .concat(categories.map((c) => `/categories/${c.slug}`))
    .concat(products.map((p) => `/products/${p.slug}`))
    .concat(blogPosts.map((p) => `/blog/${p.slug}`));
  return paths.flatMap((path) => {
    const english = `${base}${path === "/" ? "" : path}`;
    const bangla = `${base}/bn${path === "/" ? "" : path}`;
    const languages = { en: english, bn: bangla, "x-default": english };
    return [
      { url: english, alternates: { languages } },
      { url: bangla, alternates: { languages } },
    ];
  });
}
