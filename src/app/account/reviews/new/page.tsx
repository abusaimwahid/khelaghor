import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/forms/review-form";
import { assertReviewEligibility } from "@/server/reviews";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ orderItem?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  if (!params?.orderItem) notFound();
  const item = await assertReviewEligibility({
    userId: user.id,
    orderItemId: params.orderItem,
  });
  return (
    <section className="container max-w-2xl py-10">
      <ReviewForm orderItemId={item.id} productName={item.name} />
    </section>
  );
}
