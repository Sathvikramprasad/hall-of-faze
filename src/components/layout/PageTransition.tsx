import { ViewTransition, type ReactNode } from "react";

/**
 * Fades the old page out and the new one in on client-side navigation, using
 * React's <ViewTransition> (the browser's View Transitions API). Rendered by
 * the route templates, which remount on navigation so enter/exit fire.
 * Browsers without View Transitions just swap pages instantly, as before.
 * Animations live in src/app/page-transitions.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
