import { isRouteErrorResponse, useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";

interface ErrorPageProps {
  error: unknown;
}

/**
 * Styled error page — Midnight design system.
 *
 * Handles both route error responses (404, 500, 503, 504) and unexpected errors.
 * Route errors use revalidator for retry (no full page reload).
 * Truly unrecoverable errors fall back to window.location.reload().
 */
export function ErrorPage({ error }: ErrorPageProps) {
  const revalidator = useRevalidator();
  const isRouteError = isRouteErrorResponse(error);

  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteError) {
    status = error.status;
    switch (status) {
      case 404:
        title = "Page not found";
        message =
          "This page doesn't exist. It may have been moved or the URL might be wrong.";
        break;
      case 500:
        title = "Server Error";
        message =
          "Something went wrong loading this page. This is usually temporary.";
        break;
      case 503:
      case 504:
        title = "Service Unavailable";
        message =
          "The service is temporarily unavailable. Please try again in a moment.";
        break;
      default:
        title = `Error ${status}`;
        message = error.statusText || message;
        break;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleRetry = () => {
    if (isRouteError) {
      revalidator.revalidate();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-midnight px-4 supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md text-center">
        {/* Status code */}
        <p className="mb-2 text-5xl font-bold font-heading text-mn-text sm:text-6xl">
          {status}
        </p>

        {/* Title */}
        <h1 className="mb-4 text-xl font-semibold font-heading text-mn-text sm:text-2xl">
          {title}
        </h1>

        {/* Message */}
        <p className="mb-8 text-sm text-mn-text-muted sm:text-base">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Button
            variant="primary"
            onClick={handleRetry}
            disabled={revalidator.state === "loading"}
            className="w-full sm:w-auto"
          >
            {revalidator.state === "loading" ? "Retrying..." : "Try again"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
            className="w-full sm:w-auto"
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
