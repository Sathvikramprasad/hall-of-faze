import type { Metadata } from "next";
import Link from "next/link";
import UploadForm from "@/components/clips/UploadForm";

export const metadata: Metadata = {
  title: "Upload a clip · Hall of FaZe",
  description: "Submit a clip with a custom thumbnail for review.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ challengeId?: string | string[]; remix?: string | string[] }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm">
        <Link href="/clips" className="opacity-70 hover:opacity-100">
          ← All clips
        </Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">Upload a clip</h1>
      <p className="mt-2 mb-8 opacity-70">
        Add a title, your video and a custom thumbnail. A moderator reviews every clip before it goes public.
      </p>
      <UploadForm challengeId={first(params.challengeId)} remixId={first(params.remix)} />
    </main>
  );
}
