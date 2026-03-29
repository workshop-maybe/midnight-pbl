import { isRouteErrorResponse } from "react-router";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";

interface ErrorPageProps {
  error: unknown;
}

/**
 * Styled error page — Midnight design system.
 *
 * Handles both route error responses (404, 500) and unexpected errors.
 * Provides a retry button and a link back to the landing page.
 */
export function ErrorPage({ error }: ErrorPageProps) {
  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist or has been moved.";
    } else {
      title = `Error ${status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-midnight px-4">
      <div className="max-w-md text-center">
        {/* Status code */}
        <p className="mb-2 text-6xl font-bold font-heading gradient-text">
          {status}
        </p>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-semibold font-heading text-mn-text">
          {title}
        </h1>

        {/* Message */}
        <p className="mb-8 text-mn-text-muted">{message}</p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            Go home
          </Button>
        </div>

        {/* Branding */}
        <p className="mt-12 text-xs text-mn-text-muted">
          {BRANDING.name}
        </p>
      </div>
    </div>
  );
}
