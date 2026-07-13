export const categories = [
  { name: "Toys", slug: "toys", icon: "Blocks", children: ["Educational Toys", "Pretend Play", "Puzzles"] },
  { name: "Books", slug: "books", icon: "BookOpen", children: ["Picture Books", "Early Learning", "Story Books"] },
  { name: "Clothing", slug: "clothing", icon: "Shirt", children: ["Boys", "Girls", "Newborn"] },
  { name: "Baby Care", slug: "baby-care", icon: "Heart", children: ["Bath", "Diapers", "Personal Care"] },
  { name: "School", slug: "school", icon: "GraduationCap", children: ["Bags", "Stationery", "Lunch Boxes"] },
  { name: "Gifts", slug: "gifts", icon: "Gift", children: ["Birthday Gifts", "Gift Sets", "Premium"] },
  { name: "Newborn", slug: "newborn", icon: "Baby", children: ["Essentials", "Feeding", "Room"] },
  { name: "Outdoor", slug: "outdoor", icon: "Bike", children: ["Ride Ons", "Sports", "Water Play"] },
];

export const brands = ["Tiny Tots", "BrightMinds", "Borno Kids", "MiniNest", "PlayPatch", "Little Loom"];

const images = [
  "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80",
];

export const products = Array.from({ length: 32 }, (_, index) => {
  const category = categories[index % categories.length];
  const brand = brands[index % brands.length];
  const price = 550 + index * 115;
  const salePrice = index % 3 === 0 ? Math.round(price * 0.82) : null;
  return {
    id: `prod_${index + 1}`,
    name: [
      "Wooden Building Blocks",
      "Bangla Alphabet Puzzle",
      "Organic Newborn Gift Set",
      "STEM Solar Robot Kit",
      "Soft Cotton Kids Pajama",
      "School Starter Backpack",
      "Animal Story Book Bundle",
      "Outdoor Bubble Play Set",
    ][index % 8] + ` ${index + 1}`,
    slug: [
      "wooden-building-blocks",
      "bangla-alphabet-puzzle",
      "organic-newborn-gift-set",
      "stem-solar-robot-kit",
      "soft-cotton-kids-pajama",
      "school-starter-backpack",
      "animal-story-book-bundle",
      "outdoor-bubble-play-set",
    ][index % 8] + `-${index + 1}`,
    sku: `KG-${String(index + 1).padStart(4, "0")}`,
    brand,
    category: category.slug,
    categoryName: category.name,
    price,
    salePrice,
    rating: 4 + (index % 10) / 10,
    reviews: 8 + index * 3,
    stock: index % 9 === 0 ? 0 : 6 + index,
    image: images[index % images.length],
    badges: [index % 2 === 0 ? "New" : "Best Seller", salePrice ? "Sale" : "Featured"].filter(Boolean),
    age: ["0-6 months", "1-2 years", "3-5 years", "6-8 years", "9-12 years"][index % 5],
    gender: ["Boys", "Girls", "Unisex"][index % 3],
    description:
      "Designed for curious children and practical parents, with safe materials, durable construction and a joyful learning-first experience.",
  };
});

export const coupons = [
  { code: "WELCOME10", type: "PERCENT" as const, value: 10, minimumSpend: 1000, maximumDiscount: 500 },
  { code: "FREESHIP", type: "FREE_DELIVERY" as const, value: 0, minimumSpend: 1500 },
];

export const blogPosts = [
  {
    title: "Best Educational Toys by Age",
    slug: "best-educational-toys-by-age",
    excerpt: "A parent-friendly guide to choosing toys that match each child’s stage.",
  },
  {
    title: "Newborn Essentials for Bangladeshi Families",
    slug: "newborn-essentials-bangladesh",
    excerpt: "A calm checklist for the first months at home.",
  },
  {
    title: "Back to School Shopping Without Stress",
    slug: "back-to-school-shopping-guide",
    excerpt: "Bags, bottles, stationery and routines that make school mornings easier.",
  },
];

export const orders = [
  { number: "KG-2026-1001", customer: "Nusrat Jahan", total: 3280, status: "Processing", payment: "COD" },
  { number: "KG-2026-1002", customer: "Tanvir Rahman", total: 1890, status: "Delivered", payment: "bKash" },
  { number: "KG-2026-1003", customer: "Farhana Kabir", total: 5140, status: "Pending", payment: "COD" },
];
