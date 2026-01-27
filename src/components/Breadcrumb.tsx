import React from "react";

interface BreadcrumbProps {
  path: string | null;
  onNavigate?: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  if (!path) return null;

  // Split path and create segments
  const segments = path.split("/").filter(Boolean);

  // Only show last 4 segments to avoid overflow
  const visibleSegments = segments.slice(-4);
  const hasHiddenSegments = segments.length > 4;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-ink-black border-b border-dusk-blue/20 text-xs text-lavender-grey overflow-hidden">
      {/* File icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-dusk-blue flex-shrink-0"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>

      {/* Ellipsis for hidden segments */}
      {hasHiddenSegments && (
        <>
          <span className="text-lavender-grey/50">...</span>
          <ChevronIcon />
        </>
      )}

      {/* Path segments */}
      {visibleSegments.map((segment, index) => {
        const isLast = index === visibleSegments.length - 1;
        const fullPath = segments
          .slice(0, segments.length - visibleSegments.length + index + 1)
          .join("/");

        return (
          <React.Fragment key={index}>
            <span
              className={`truncate max-w-[150px] ${
                isLast
                  ? "text-alabaster-grey font-medium"
                  : "hover:text-alabaster-grey cursor-pointer"
              }`}
              onClick={() => !isLast && onNavigate?.(fullPath)}
              title={segment}
            >
              {segment}
            </span>
            {!isLast && <ChevronIcon />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-lavender-grey/40 flex-shrink-0"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
