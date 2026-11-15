import type { Metadata } from "next";
import ModerationDashboard from "@/components/clips/ModerationDashboard";

export const metadata: Metadata = {
  title: "Clip moderation · Hall of FaZe",
  robots: { index: false, follow: false },
};

export default function AdminClipsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Clip moderation</h1>
      <p className="mt-1 mb-8 opacity-70">
        Approve clips to make them public and vote-eligible. Rejected and pending clips stay private.
      </p>
      <ModerationDashboard />
    </main>
  );
}
