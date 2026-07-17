import { saveReviewAction } from "@/app/actions/customer";
import { UploadField } from "./upload-field";

export function ReviewForm({
  orderItemId,
  review,
  productName,
}: {
  orderItemId: string;
  productName: string;
  review?: { id: string; rating: number; title: string | null; text: string };
}) {
  return (
    <form action={saveReviewAction} className="kg-card space-y-4 p-6">
      <input type="hidden" name="reviewId" value={review?.id ?? ""} />
      <input type="hidden" name="orderItemId" value={orderItemId} />
      <h1 className="text-2xl font-black text-navy">
        {review ? "Edit Review" : "Write Review"}
      </h1>
      <p className="font-bold text-slate-600">{productName}</p>
      <label className="block font-bold text-navy">
        Rating
        <select
          name="rating"
          defaultValue={review?.rating ?? 5}
          className="kg-input mt-2"
        >
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} stars
            </option>
          ))}
        </select>
      </label>
      <label className="block font-bold text-navy">
        Title
        <input
          name="title"
          defaultValue={review?.title ?? ""}
          className="kg-input mt-2"
        />
      </label>
      <label className="block font-bold text-navy">
        Review
        <textarea
          name="text"
          required
          defaultValue={review?.text ?? ""}
          className="kg-input mt-2 min-h-36"
        />
      </label>
      <UploadField name="imageUrls" purpose="review" label="Review images" maxFiles={5} />
      <button className="rounded-md bg-coral px-5 py-3 font-black text-white">
        Submit for moderation
      </button>
    </form>
  );
}
