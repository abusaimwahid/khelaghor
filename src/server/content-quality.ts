export type QualityProduct = {
  id: string;
  name: string;
  nameBn: string | null;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  safetyInfo: string | null;
  ageGroup: string | null;
  material: string | null;
  deliveryClass: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  brandId: string | null;
  regularPrice: unknown;
  salePrice: unknown;
  stock: number;
  images: { alt: string; url: string }[];
  categories: unknown[];
  variants: unknown[];
};
export function productQualityWarnings(product: QualityProduct) {
  const warnings: string[] = [];
  if (!product.nameBn) warnings.push("Bangla name");
  if (!product.brandId) warnings.push("brand");
  if (!product.categories.length) warnings.push("category");
  if (!product.images.length) warnings.push("image");
  if (product.images.some((image) => !image.alt.trim()))
    warnings.push("image alt text");
  if (!product.shortDescription || product.shortDescription.length < 20)
    warnings.push("short description");
  if (!product.fullDescription || product.fullDescription.length < 60)
    warnings.push("full description");
  if (!product.safetyInfo) warnings.push("safety information");
  if (!product.ageGroup) warnings.push("age suitability");
  if (!product.material) warnings.push("material");
  if (!product.deliveryClass) warnings.push("delivery class");
  if (!product.seoTitle) warnings.push("SEO title");
  if (!product.seoDescription) warnings.push("SEO description");
  if (Number(product.regularPrice) <= 0) warnings.push("price");
  if (product.stock < 0) warnings.push("invalid stock");
  if (
    product.salePrice != null &&
    Number(product.salePrice) >= Number(product.regularPrice)
  )
    warnings.push("sale price");
  return warnings;
}
