import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

/** Animates moving between pages inside /clips (the root template only covers switching sections). */
export default function ClipsTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
