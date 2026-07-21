import Image from "next/image";
import Link from "next/link";
import { deleteReviewAction } from "@/app/actions/customer";
import { listReviewEligibility } from "@/server/reviews";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const user = await requireUser();
  const [eligible, reviews] = await Promise.all([
    listReviewEligibility(user.id),
    prisma.review.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { images: true,
        product: {
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <section className="space-y-5 pb-10">
      <header className="kg-card p-6">
        <p className="text-sm font-black uppercase text-teal">
          Verified purchases
        </p>
        <h1 className="text-3xl font-black text-navy">My reviews</h1><p className="mt-2 text-sm leading-6 text-slate-600">Only delivered purchases are eligible. Published ratings contribute to the public product score after approval.</p>
      </header>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Eligible Products</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {eligible.map((item) => (
            <article
              key={item.id}
              className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <Thumb src={item.product.images[0]?.url} />
              <div>
                <strong className="text-navy">{item.product.name}</strong>
                <p className="text-sm text-slate-500">
                  Order {item.order.number}
                </p>
                <Link
                  href={`/account/reviews/new?orderItem=${item.id}`}
                  className="mt-2 inline-flex rounded-md bg-coral px-3 py-2 text-sm font-black text-white"
                >
                  Write review
                </Link>
              </div>
            </article>
          ))}
          {!eligible.length ? (
            <p className="text-sm font-semibold text-slate-500">
              No delivered products are awaiting review.
            </p>
          ) : null}
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Submitted Reviews</h2>
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4"
            >
              <Thumb src={review.product.images[0]?.url} />
              <div className="min-w-0 flex-1">
                <strong className="text-navy">{review.product.name}</strong>
                <div className="mt-1 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-sm font-black text-orange"><Star className="h-4 w-4 fill-current" />{review.rating}/5</span><StatusBadge>{review.status}</StatusBadge></div>
                {review.title ? <h3 className="mt-2 font-black text-navy">{review.title}</h3> : null}
                <p className="line-clamp-2 text-sm text-slate-600">
                  {review.text}
                </p>
                {review.images.length ? <div className="mt-2 flex flex-wrap gap-2" aria-label={`${review.images.length} review attachments`}>{review.images.map((image, index) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="relative h-14 w-14 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]"><Image src={image.url} alt={`Review evidence ${index + 1}`} fill sizes="56px" className="object-cover" /></a>)}</div> : null}
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/account/reviews/${review.id}/edit`}
                    className="rounded-md border px-3 py-2 text-sm font-bold"
                  >
                    Edit
                  </Link>
                  <form action={deleteReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button className="rounded-md bg-coral/10 px-3 py-2 text-sm font-bold text-coral">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {!reviews.length ? <EmptyState title="No submitted reviews" description="Your pending, approved and rejected reviews will be kept together here." /> : null}
        </div>
      </section>
    </section>
  );
}

function Thumb({ src }: { src?: string }) {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-white">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="80px"
          className="object-contain p-1"
        />
      ) : null}
    </div>
  );
}
