import { FlashSale } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";
import { getHomepageSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [homepage, products] = await Promise.all([
    getHomepageSettings(),
    listProducts({ take: 32 }),
  ]);
  return (
    <FlashSale
      section={{ ...homepage.flashSale, enabled: true }}
      products={products
        .map(productToCard)
        .filter((product) => product.salePrice)}
    />
  );
}
