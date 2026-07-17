import Image from "next/image";
import Link from "next/link";
import { deleteReviewAction } from "@/app/actions/customer";
import { listReviewEligibility } from "@/server/reviews";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const user = await requireUser();
  const [eligible, reviews] = await Promise.all([
    listReviewEligibility(user.id),
    prisma.review.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        product: {
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <section className="container space-y-8 py-10">
      <header className="kg-card p-6">
        <p className="text-sm font-black uppercase text-teal">
          Verified purchases
        </p>
        <h1 className="text-3xl font-black text-navy">My Reviews</h1>
      </header>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Eligible Products</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {eligible.map((item) => (
            <article
              key={item.id}
              className="flex gap-3 rounded-md bg-cream p-3"
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
              className="flex gap-3 rounded-md bg-cream p-3"
            >
              <Thumb src={review.product.images[0]?.url} />
              <div className="min-w-0 flex-1">
                <strong className="text-navy">{review.product.name}</strong>
                <p className="text-sm font-bold text-slate-500">
                  {review.rating}/5 • {review.status}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {review.text}
                </p>
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
          {!reviews.length ? (
            <p className="text-sm font-semibold text-slate-500">
              You have not submitted reviews yet.
            </p>
          ) : null}
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
