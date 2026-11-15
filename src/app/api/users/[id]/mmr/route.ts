import { fail, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getPlayerMmr } from "@/lib/mmr-server";
import User from "@/models/User";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return fail(404, "NOT_FOUND", "Player not found.");
  try {
    await connectDB();
    const user = await User.findById(id).select("displayName").lean().exec();
    if (!user) return fail(404, "NOT_FOUND", "Player not found.");
    return ok({ displayName: user.displayName, ...await getPlayerMmr(id) });
  } catch (error) {
    console.error("Public ranking lookup failed", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load rank.");
  }
}
