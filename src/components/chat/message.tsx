"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageProps {
    role: "user" | "assistant"
    content: string
    isStreaming?: boolean
}

export function Message({ role, content, isStreaming }: MessageProps) {
    const isUser = role === "user"

    return (
        <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-md px-3 py-2 text-sm border",
                    isUser
                        ? "bg-background-2 border-divider-2"
                        : "bg-background-1 border-divider-2"
                )}
            >
                {isUser ? (
                    <span>{content}</span>
                ) : (
                    <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                code: CodeBlock,
                                pre: ({ children }) => <>{children}</>,
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                a: ({ href, children }) => (
                                    <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
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
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function CodeBlock({ children, className, ...props }: any) {
    const [copied, setCopied] = useState(false)
    const isInline = !className

    if (isInline) {
        return (
            <code className="bg-background-2 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
            </code>
        )
    }

    const codeContent = String(children).replace(/\n$/, "")

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative group my-2">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded bg-background-2 hover:bg-background-1 border border-divider-2 transition-colors"
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
                    "block bg-background-2 p-3 rounded border border-divider-2 overflow-x-auto text-xs font-mono",
                    className
                )}
                {...props}
            >
                {children}
            </code>
        </div>
    )
}
