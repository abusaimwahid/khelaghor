import Link from "next/link";
import { Wrench } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
export default function Page() { return <SimplePage title="Store maintenance"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center"><Wrench className="mx-auto h-9 w-9 text-coral" /><h2 className="mt-3 text-xl font-black text-navy">We’ll be back soon</h2><p className="mx-auto mt-2 max-w-lg">The storefront is temporarily unavailable while scheduled work is completed. No restoration time is claimed until an approved notice is published.</p><Link href="/" className="kg-button kg-button-secondary mt-5">Try storefront</Link></div></SimplePage>; }
