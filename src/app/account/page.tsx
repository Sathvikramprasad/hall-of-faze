import type { Metadata } from "next";
import AccountPanel from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "My Profile · Hall of FaZe",
  description: "Sign in, manage your profile and see every clip you've submitted to Hall of FaZe challenges.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <AccountPanel />
    </main>
  );
}
