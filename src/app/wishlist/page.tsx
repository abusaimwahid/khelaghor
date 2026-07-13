import { ProductGrid } from "@/components/sections";
import { products } from "@/data/catalog";
export default function Page() { return <ProductGrid title="Wishlist" items={products.slice(0, 4)} eyebrow="Saved products" />; }
