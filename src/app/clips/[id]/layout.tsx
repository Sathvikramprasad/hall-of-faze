import { Suspense, type ReactNode } from "react";
import AuthenticatedPage from "@/components/auth/AuthenticatedPage";

type Params = Promise<{ id: string }>;

async function ProtectedClipDetail({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { id } = await params;
  return (
    <AuthenticatedPage returnTo={`/clips/${encodeURIComponent(id)}`}>
      {children}
    </AuthenticatedPage>
  );
}

export default function ClipDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  return (
    <Suspense
      fallback={
        <p className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-muted">
          Checking sign-in…
        </p>
      }
    >
      <ProtectedClipDetail params={params}>{children}</ProtectedClipDetail>
    </Suspense>
  );
}
