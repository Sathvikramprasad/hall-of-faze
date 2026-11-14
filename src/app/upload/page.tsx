import type { Metadata } from "next";
import Link from "next/link";
import UploadForm from "@/components/clips/UploadForm";

export const metadata: Metadata = {
  title: "Upload a clip · Hall of FaZe",
  description: "Submit a clip with a custom thumbnail for review.",
};

export default function UploadPage() {
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
      <UploadForm />
    </main>
  );
}
