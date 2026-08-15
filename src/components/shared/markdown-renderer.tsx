"use client";
import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border border-border rounded-t-md text-[11px] font-mono text-muted-foreground">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          fontSize: "0.85rem",
          background: "oklch(0.16 0 0)",
        }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

const components: Components = {
  code(props) {
    const { className, children, ...rest } = props as {
      className?: string;
      children?: React.ReactNode;
      inline?: boolean;
    } & Record<string, unknown>;
    const match = /language-(\w+)/.exec(className || "");
    const value = String(children ?? "").replace(/\n$/, "");
    const isInline = !className && !String(children ?? "").includes("\n");
    if (isInline) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return <CodeBlock language={match?.[1] || ""} value={value} />;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children, ...rest }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  },
};

function MarkdownRendererBase({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererBase);
