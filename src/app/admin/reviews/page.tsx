import Link from "next/link";
import { ReviewStatus } from "@prisma/client";
import {
  moderateReviewAction,
  setReviewFeaturedAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    rating?: string;
    verified?: string;
    featured?: string;
    page?: string;
  }>;
}) {
  await requirePermission("settings.update");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? 1));
  const q = params?.q?.trim() ?? "";
  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { text: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            {
              product: { name: { contains: q, mode: "insensitive" as const } },
            },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(Object.values(ReviewStatus).includes(params?.status as ReviewStatus)
      ? { status: params?.status as ReviewStatus }
      : {}),
    ...(params?.rating ? { rating: Number(params.rating) } : {}),
    ...(params?.verified === "true" ? { verifiedPurchase: true } : {}),
    ...(params?.verified === "false" ? { verifiedPurchase: false } : {}),
    ...(params?.featured === "true" ? { featured: true } : {}),
    ...(params?.featured === "false" ? { featured: false } : {}),
  };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.review.count({ where }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="Reviews"
        description="Moderate verified customer reviews, public replies, suspicious flags and featured states."
      />
      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search reviews"
          className="h-11 min-w-56 flex-1 rounded-md border px-3"
        />
        <select
          name="status"
          defaultValue={params?.status ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any status</option>
          {Object.values(ReviewStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          name="rating"
          defaultValue={params?.rating ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
        <select
          name="verified"
          defaultValue={params?.verified ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any verified</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select
          name="featured"
          defaultValue={params?.featured ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
        <button className="rounded-md bg-navy px-4 font-black text-white">
          Filter
        </button>
      </form>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Customer",
                  "Product",
                  "Rating",
                  "Excerpt",
                  "Verified",
                  "Status",
                  "Featured",
                  "Created",
                  "Actions",
                ].map((head) => (
                  <th key={head} className="p-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-t border-[var(--border)]">
                  <td className="p-3">{review.user.email}</td>
                  <td className="p-3">{review.product.name}</td>
                  <td className="p-3">{review.rating}/5</td>
                  <td className="p-3">{review.text.slice(0, 90)}</td>
                  <td className="p-3">
                    {review.verifiedPurchase ? "Yes" : "No"}
                  </td>
                  <td className="p-3">{review.status}</td>
                  <td className="p-3">{review.featured ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {review.createdAt.toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/reviews/${review.id}`}
                        className="rounded-md border px-3 py-2 font-bold"
                      >
                        Open
                      </Link>
                      <ReviewButton
                        id={review.id}
                        action="approve"
                        label="Approve"
                      />
                      <ReviewButton
                        id={review.id}
                        action="reject"
                        label="Reject"
                      />
                      <ReviewButton id={review.id} action="hide" label="Hide" />
                      <form action={setReviewFeaturedAction}>
                        <input
                          type="hidden"
                          name="reviewId"
                          value={review.id}
                        />
                        <input
                          type="hidden"
                          name="featured"
                          value={String(!review.featured)}
                        />
                        <button className="rounded-md border px-3 py-2 font-bold">
                          {review.featured ? "Unfeature" : "Feature"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm font-bold text-slate-500">
        Page {page} of {Math.max(1, Math.ceil(total / 25))}
      </p>
    </AdminShell>
  );
}

function ReviewButton({
  id,
  action,
  label,
}: {
  id: string;
  action: string;
  label: string;
}) {
  return (
    <form action={moderateReviewAction}>
      <input type="hidden" name="reviewId" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className="rounded-md border px-3 py-2 font-bold">{label}</button>
    </form>
  );
}
