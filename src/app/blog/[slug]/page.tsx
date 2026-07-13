import { notFound } from "next/navigation";
import { blogPosts, products } from "@/data/catalog";
import { ProductGrid } from "@/components/sections";

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();
  return (
    <article className="container py-12">
      <p className="font-black uppercase text-teal">Parent guide • 5 min read</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-black text-navy">{post.title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{post.excerpt} KhelaGhor content is managed through the admin CMS model with SEO fields, tags, related articles and related products.</p>
      <ProductGrid title="Related Products" items={products.slice(0, 4)} />
    </article>
  );
}
