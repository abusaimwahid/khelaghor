import { ProductGrid } from "@/components/sections";
import { products } from "@/data/catalog";
export default function Page() { return <ProductGrid title="Offers" items={products.filter((p) => p.salePrice)} eyebrow="Deals" />; }
