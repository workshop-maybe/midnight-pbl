/**
 * MeshProvider wrapper — .client.tsx
 *
 * This file MUST use the .client.tsx extension. React Router v7 excludes
 * .client.tsx files from the server bundle entirely, preventing the
 * @meshsdk/react WASM initialization crash during SSR.
 *
 * @see https://reactrouter.com/explanation/special-files#client-modules
 */

import { MeshProvider } from "@meshsdk/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function MeshProviderWrapper({ children }: Props) {
  return <MeshProvider>{children}</MeshProvider>;
}
