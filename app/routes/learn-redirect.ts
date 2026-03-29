/**
 * Redirect /learn to / for backward compatibility.
 *
 * Course overview is now the index route at /.
 */

import { redirect } from "react-router";

export function loader() {
  return redirect("/", 301);
}
