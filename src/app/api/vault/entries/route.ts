import { NextResponse } from "next/server";
import { getMembers, getVaultEntries } from "@/lib/vault/queries";

// GET /api/vault/entries — the curated Vault as JSON, for other branches
// (or a future admin tool) to read without importing our modules.

export async function GET() {
  return NextResponse.json({
    entries: getVaultEntries(),
    members: getMembers(),
  });
}
