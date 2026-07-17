import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/forms/review-form";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const review = await prisma.review.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { orderItem: true, product: true },
  });
  if (!review || !review.orderItem) notFound();
  return (
    <section className="container max-w-2xl py-10">
      <ReviewForm
        orderItemId={review.orderItem.id}
        productName={review.product.name}
        review={review}
      />
    </section>
  );
}
