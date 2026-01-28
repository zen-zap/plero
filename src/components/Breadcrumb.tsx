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

  // Get file extension for icon color
  const fileName = segments[segments.length - 1] || "";
  const getFileColor = () => {
    if (fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
      return "text-blue-400";
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx"))
      return "text-yellow-400";
    if (fileName.endsWith(".rs")) return "text-orange-400";
    if (fileName.endsWith(".py")) return "text-green-400";
    if (fileName.endsWith(".css")) return "text-pink-400";
    if (fileName.endsWith(".html")) return "text-red-400";
    if (fileName.endsWith(".json")) return "text-yellow-300";
    if (fileName.endsWith(".md")) return "text-lavender-grey";
    return "text-dusk-blue";
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-ink-black to-ink-black/80 border-b border-dusk-blue/15 text-xs text-lavender-grey overflow-hidden">
      {/* File icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${getFileColor()} flex-shrink-0`}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>

      {/* Ellipsis for hidden segments -- nice */}
      {hasHiddenSegments && (
        <>
          <span className="text-lavender-grey/40 px-1">•••</span>
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
              className={`truncate max-w-[180px] px-1.5 py-0.5 rounded-md transition-all ${
                isLast
                  ? "text-alabaster-grey font-semibold bg-dusk-blue/10"
                  : "hover:text-alabaster-grey hover:bg-dusk-blue/10 cursor-pointer"
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

// the forward arrow shaped icon
const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-lavender-grey/30 flex-shrink-0"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
