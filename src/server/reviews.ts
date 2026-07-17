import { OrderStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "./db";

export class ReviewError extends Error {
  constructor(
    message: string,
    readonly code = "REVIEW_INVALID",
  ) {
    super(message);
  }
}

export async function listReviewEligibility(userId: string) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: { userId, status: OrderStatus.DELIVERED },
      product: { archivedAt: null },
    },
    include: {
      order: true,
      product: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      review: true,
    },
    orderBy: { order: { deliveredAt: "desc" } },
  });
  return items.filter((item) => !item.review || item.review.deletedAt);
}

export async function assertReviewEligibility(input: {
  userId: string;
  orderItemId: string;
  reviewId?: string;
}) {
  const item = await prisma.orderItem.findFirst({
    where: {
      id: input.orderItemId,
      order: { userId: input.userId, status: OrderStatus.DELIVERED },
    },
    include: { order: true, product: true, review: true },
  });
  if (!item)
    throw new ReviewError("Only delivered purchased products can be reviewed.");
  if (!item.product || item.product.archivedAt)
    throw new ReviewError("Product is not available for review.");
  const existing = await prisma.review.findFirst({
    where: {
      productId: item.productId,
      userId: input.userId,
      deletedAt: null,
      ...(input.reviewId ? { id: { not: input.reviewId } } : {}),
    },
  });
  if (existing)
    throw new ReviewError("You have already reviewed this product.");
  return item;
}

export async function approvedReviewStats(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: ReviewStatus.APPROVED,
      deletedAt: null,
      hiddenAt: null,
    },
    select: { rating: true },
  });
  return {
    count: reviews.length,
    average: reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    })),
  };
}
