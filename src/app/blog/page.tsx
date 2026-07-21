import Link from "next/link";
import { blogPosts } from "@/data/catalog";

export default function BlogPage() {
  return (
    <section className="container storefront-page"><header className="storefront-surface bg-gradient-to-br from-[#fff4f6] via-white to-[#eaf9f6] p-7 md:p-12"><p className="storefront-eyebrow">Ideas for families</p><h1 className="storefront-title mt-3">KhelaGhor blog</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Browse the guides currently published with the storefront.</p></header>
      <div className="mt-6 grid gap-4 md:grid-cols-3">{blogPosts.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`} className="storefront-surface storefront-lift group p-6"><p className="storefront-eyebrow">Parent guide</p><h2 className="mt-2 text-xl font-black text-navy group-hover:text-coral">{post.title}</h2><p className="mt-3 leading-7 text-slate-600">{post.excerpt}</p><span className="mt-5 inline-block font-black text-coral">Read guide →</span></Link>)}</div>
    </section>
  );
}
