import { ProductGrid } from "@/components/sections";
import { products } from "@/data/catalog";
export default function Page() { return <ProductGrid title="New Arrivals" items={products.slice(8, 20)} />; }
