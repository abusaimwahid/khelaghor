import { notFound } from "next/navigation";
import {
  moderateReviewAction,
  removeReviewReplyAction,
  saveReviewReplyAction,
  setReviewFeaturedAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("settings.update");
  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      product: true,
      user: true,
      images: true,
      replies: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!review) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={`Review: ${review.product.name}`}
        description="Moderate status, featured state and public admin replies."
      />
      <section className="kg-card space-y-4 p-6">
        <p className="font-bold text-slate-500">
          {review.user.email} • {review.rating}/5 • {review.status} •{" "}
          {review.verifiedPurchase ? "Verified purchase" : "Unverified"}
        </p>
        {review.title ? (
          <h2 className="text-xl font-black text-navy">{review.title}</h2>
        ) : null}
        <p className="leading-7 text-slate-700">{review.text}</p>
        <div className="flex flex-wrap gap-2">
          {["approve", "reject", "hide", "restore", "suspicious"].map(
            (action) => (
              <form key={action} action={moderateReviewAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <input type="hidden" name="action" value={action} />
                <button className="rounded-md border px-3 py-2 font-bold capitalize">
                  {action}
                </button>
              </form>
            ),
          )}
          <form action={setReviewFeaturedAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <input
              type="hidden"
              name="featured"
              value={String(!review.featured)}
            />
            <button className="rounded-md bg-sun px-3 py-2 font-black text-navy">
              {review.featured ? "Remove featured" : "Feature"}
            </button>
          </form>
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Public Reply</h2>
        <form action={saveReviewReplyAction} className="mt-4 flex gap-2">
          <input type="hidden" name="reviewId" value={review.id} />
          <input
            name="body"
            className="h-11 min-w-0 flex-1 rounded-md border px-3"
            placeholder="Reply publicly"
          />
          <button className="rounded-md bg-coral px-4 font-black text-white">
            Reply
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {review.replies.map((reply) => (
            <article key={reply.id} className="rounded-md bg-cream p-3 text-sm">
              <p>{reply.body}</p>
              <form action={removeReviewReplyAction} className="mt-2">
                <input type="hidden" name="replyId" value={reply.id} />
                <button className="font-bold text-coral">Remove</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
