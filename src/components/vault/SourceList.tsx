import type { SourceLink } from "@/lib/vault/types";

export function SourceList({ sources, className = "" }: { sources: SourceLink[]; className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      <span className="font-medium">Sources: </span>
      {sources.map((source, i) => (
        <span key={source.url}>
          {i > 0 && ", "}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {source.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      ))}
    </p>
  );
}
