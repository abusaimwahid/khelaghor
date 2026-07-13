import type { MetadataRoute } from "next";
import { blogPosts, categories, products } from "@/data/catalog";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return [
    "/",
    "/shop",
    "/categories",
    "/brands",
    "/blog",
    "/about-us",
    "/contact-us",
  ]
    .map((path) => ({ url: `${base}${path}` }))
    .concat(categories.map((c) => ({ url: `${base}/categories/${c.slug}` })))
    .concat(products.map((p) => ({ url: `${base}/products/${p.slug}` })))
    .concat(blogPosts.map((p) => ({ url: `${base}/blog/${p.slug}` })));
}
