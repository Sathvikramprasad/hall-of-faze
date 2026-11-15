import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

/** Animates moving between pages inside /next-up (the root template only covers switching sections). */
export default function NextUpTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
