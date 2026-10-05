import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Full current query string (without page) to preserve filters in links. */
  searchParams: Record<string, string | string[] | undefined>;
  /** Route the links point at — keeps filters on the same list. */
  basePath?: string;
}

const WINDOW = 2;

function pageHref(
  page: number,
  searchParams: PaginationProps["searchParams"],
  basePath: string,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.set(key, value);
    }
  }
  if (page === 1) params.delete("page");
  else params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function pageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const window = new Set<number>([1, 2, totalPages - 1, totalPages]);
  for (let i = page - WINDOW; i <= page + WINDOW; i += 1) {
    if (i >= 1 && i <= totalPages) window.add(i);
  }
  return [...window].sort((a, b) => a - b);
}

/**
 * Server-rendered, Link-based pagination — no client JS needed.
 */
export function Pagination({
  page,
  totalPages,
  searchParams,
  basePath = "/assets",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const numbers = pageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        asChild={page > 1}
      >
        {page > 1 ? (
          <Link
            href={pageHref(page - 1, searchParams, basePath)}
            aria-label="Previous page"
          >
            ← Prev
          </Link>
        ) : (
          <span aria-hidden="true">← Prev</span>
        )}
      </Button>

      {numbers.map((n) => (
        <Button
          key={n}
          variant={n === page ? "default" : "outline"}
          size="sm"
          asChild={n !== page}
          className={cn(n === page && "pointer-events-none")}
          aria-current={n === page ? "page" : undefined}
        >
          {n === page ? (
            <span>{n}</span>
          ) : (
            <Link href={pageHref(n, searchParams, basePath)}>{n}</Link>
          )}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        asChild={page < totalPages}
      >
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1, searchParams, basePath)}
            aria-label="Next page"
          >
            Next →
          </Link>
        ) : (
          <span aria-hidden="true">Next →</span>
        )}
      </Button>
    </nav>
  );
}
