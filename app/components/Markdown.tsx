import ReactMarkdown from "marked-react";

interface MarkdownProps {
  children: string;
  className?: string;
}

export default function Markdown({ children, className = "" }: MarkdownProps) {
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
