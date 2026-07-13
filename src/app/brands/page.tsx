import Link from "next/link";
import { listBrands } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await listBrands();
  return <section className="container py-12"><h1 className="text-4xl font-black text-navy">Brands</h1><div className="mt-8 grid gap-4 md:grid-cols-3">{brands.map((brand) => <Link key={brand.id} href={`/brands/${brand.slug}`} className="rounded-lg bg-white p-8 text-center text-xl font-black text-navy shadow-sm">{brand.name}</Link>)}</div></section>;
}
