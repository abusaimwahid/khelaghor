import Link from "next/link";
import { blogPosts } from "@/data/catalog";

export default function BlogPage() {
  return (
    <section className="container py-12">
      <h1 className="text-4xl font-black text-navy">KhelaGhor Blog</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{blogPosts.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-navy">{post.title}</h2><p className="mt-3 text-slate-600">{post.excerpt}</p></Link>)}</div>
    </section>
  );
}
