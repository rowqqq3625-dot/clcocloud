type StarDisplayProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
};

/**
 * Read-only star renderer. Pure unicode glyphs to avoid pulling in an
 * icon library. Half stars are rounded down to integer fills since
 * reviews.rating is a smallint.
 */
export function StarDisplay({ rating, size = "md" }: StarDisplayProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  const sizeClass =
    size === "sm" ? "text-sm gap-0.5" : size === "lg" ? "text-2xl gap-1.5" : "text-base gap-1";

  return (
    <div className={`inline-flex items-center ${sizeClass}`} aria-label={`별점 ${clamped}점`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={star <= clamped ? "text-coral" : "text-secondary/30"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
