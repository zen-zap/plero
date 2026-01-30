import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      {/* Different markdown things */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-ink-black/80 text-dusk-blue px-1.5 py-0.5 rounded text-xs font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group my-2">
                {match && (
                  <span className="absolute top-1 right-2 text-[10px] text-lavender-grey/60 uppercase">
                    {match[1]}
                  </span>
                )}
                <pre className="bg-ink-black/80 rounded-md p-3 overflow-x-auto custom-scrollbar">
                  <code
                    className={`${className || ""} text-xs font-mono text-alabaster-grey`}
                    {...props}
                  >
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-alabaster-grey mt-3 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-alabaster-grey mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-alabaster-grey mt-2 mb-1">
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm text-alabaster-grey mb-2 leading-relaxed">
              {children}
            </p>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dusk-blue hover:text-lavender-grey underline"
            >
              {children}
            </a>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-alabaster-grey mb-2 space-y-1 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-alabaster-grey mb-2 space-y-1 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-dusk-blue pl-3 my-2 text-sm text-lavender-grey italic">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-sm border border-ink-black/50 rounded">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-ink-black/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 text-left text-xs font-semibold text-lavender-grey border-b border-ink-black/50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-alabaster-grey border-b border-ink-black/30">
              {children}
            </td>
          ),
          // Horizontal rule
          hr: () => <hr className="border-ink-black/50 my-3" />,
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-alabaster-grey">
              {children}
            </strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-lavender-grey">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
