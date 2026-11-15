import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

/** Animates moving between pages inside /vault (the root template only covers switching sections). */
export default function VaultTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
