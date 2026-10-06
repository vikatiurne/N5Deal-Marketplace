"use client";

import * as React from "react";

/**
 * Last-resort boundary: catches failures in the root layout itself, which
 * `error.tsx` cannot (it renders *inside* that layout). It must therefore
 * supply its own `<html>`/`<body>` and cannot use the app's CSS variables
 * until the stylesheet loads — hence the inline background and the plain
 * system font stack.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surfaces in the browser console too, not just the server log.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d10",
          color: "#e6e9ef",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{ maxWidth: "32rem", padding: "2rem", textAlign: "center" }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            The application failed to load
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#8b93a1",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            This is not a page-specific problem — reloading may fix it. If it
            does not, the server log has the full stack trace.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.75rem",
                color: "#8b93a1",
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.25rem",
              padding: "0 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#10b981",
              color: "#04150e",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}
