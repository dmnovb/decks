"use client";

import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarIcon } from "@/icons";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const Message = memo(function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-background-2 border border-divider-1 rounded-sm px-3 py-2 text-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <StarIcon size={10} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1 max-w-[85%]">
        <AssistantMarkdown content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
});


function AssistantMarkdown({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 ml-4 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 list-decimal">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-2">{children}</h3>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-divider-2 pl-3 italic my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-divider-2">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-divider-2 px-2 py-1 bg-background-2 font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-divider-2 px-2 py-1">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-[2px] h-[13px] bg-primary/60 animate-pulse ml-0.5 align-middle rounded-full" />
      )}
    </div>
  );
}

function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const isInline = !className;

  if (isInline) {
    return (
      <code
        className="bg-background-2 px-1.5 py-0.5 rounded text-xs font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  const codeContent = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-sm bg-background-2 hover:bg-background-1 border border-divider-2 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
      <code
        className={cn(
          "block bg-background-2 p-3 rounded-sm border border-divider-1 overflow-x-auto text-xs font-mono",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    </div>
  );
}
