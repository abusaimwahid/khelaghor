import { ProductGrid } from "@/components/sections";
import { products } from "@/data/catalog";
export default function Page() { return <ProductGrid title="Best Sellers" items={products.slice(12, 28)} />; }
