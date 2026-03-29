/**
 * Module Redirect Route
 *
 * Redirects /learn/:moduleCode to /learn/:moduleCode/1 (first lesson).
 * This eliminates the module overview page as an interstitial — clicking
 * a module card on the course overview goes directly to the first lesson.
 *
 * Route: /learn/:moduleCode
 */

import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export function loader({ params }: LoaderFunctionArgs) {
  const moduleCode = params.moduleCode;
  if (!moduleCode) {
    throw new Response("Module code is required", { status: 400 });
  }

  // SLT indices are 1-based — first lesson is at index 1
  return redirect(`/learn/${moduleCode}/1`);
}
