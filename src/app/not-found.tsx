import Link from "next/link";
export default function NotFound() { return <section className="container py-20 text-center"><h1 className="text-5xl font-black text-navy">404</h1><p className="mt-3 text-slate-600">This page is hiding from playtime.</p><Link href="/" className="mt-6 inline-block rounded-md bg-coral px-6 py-3 font-black text-white">Go home</Link></section>; }
