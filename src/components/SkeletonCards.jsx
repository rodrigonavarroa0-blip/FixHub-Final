/* SKELETON CARDS - COMPONENT */
/* Grey placeholder cards with a shimmer animation, shown while the catalog is loading. */

export default function SkeletonCards({ count = 3 }) {
    return Array.from({ length: count }, (_, index) => (
        <article key={index} className="card skeleton-card" aria-hidden="true">
            <span className="skeleton skeleton-line short"></span>
            <span className="skeleton skeleton-line title"></span>
            <span className="skeleton skeleton-line"></span>
            <span className="skeleton skeleton-line"></span>
        </article>
    ));
}
