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
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Star } from "lucide-react";

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
      <Link href="/admin/reviews" className="text-sm font-black text-coral">← Back to moderation queue</Link>
      <section className="kg-card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 font-black text-orange"><Star className="h-4 w-4 fill-current" />{review.rating}/5</span><StatusBadge>{review.status}</StatusBadge>{review.verifiedPurchase ? <StatusBadge>VERIFIED PURCHASE</StatusBadge> : null}<span className="text-sm font-bold text-slate-500">{review.user.email}</span></div>
        {review.title ? (
          <h2 className="text-xl font-black text-navy">{review.title}</h2>
        ) : null}
        <p className="leading-7 text-slate-700">{review.text}</p>
        {review.images.length ? <div className="flex flex-wrap gap-3">{review.images.map((image, index) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="relative h-24 w-24 overflow-hidden rounded-xl border border-[var(--border)]"><Image src={image.url} alt={`Review evidence ${index + 1}`} fill sizes="96px" className="object-cover" /></a>)}</div> : null}
        <div className="admin-actions border-t border-[var(--border)] pt-4">
          {["approve", "reject", "hide", "restore", "suspicious"].map(
            (action) => (
              <form key={action} action={moderateReviewAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <input type="hidden" name="action" value={action} />
                <button className={action === "approve" || action === "restore" ? "admin-button bg-emerald-600 text-white capitalize" : action === "reject" || action === "hide" ? "admin-button admin-button-danger capitalize" : "admin-button admin-button-secondary capitalize"}>
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
            <button className="admin-button bg-sun text-navy">
              {review.featured ? "Remove featured" : "Feature"}
            </button>
          </form>
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Public Reply</h2>
        <form action={saveReviewReplyAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="reviewId" value={review.id} />
          <input
            name="body"
            className="h-11 min-w-0 flex-1 rounded-md border px-3"
            placeholder="Reply publicly"
          />
          <button className="admin-button admin-button-primary">
            Reply
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {review.replies.map((reply) => (
            <article key={reply.id} className="rounded-xl bg-[var(--surface-soft)] p-4 text-sm">
              <p>{reply.body}</p>
              <form action={removeReviewReplyAction} className="mt-2">
                <input type="hidden" name="replyId" value={reply.id} />
                <button className="admin-button admin-button-danger">Remove reply</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
