import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import "./page-transitions.css";

/** Remounts whenever the top-level section changes (/, /vault, /clips…), animating the switch. */
export default function RootTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
