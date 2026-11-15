import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { createDownloadUrl } from "@/lib/storage";
import UserModel from "@/models/User";

type Context = { params: Promise<{ id: string }> };

/** GET — redirects to a short-lived signed URL for a user's profile picture (404 when they use the letter avatar). */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });
  try {
    await connectDB();
    const user = await UserModel.findById(id).select("avatarKey avatarContentType").lean().exec();
    if (!user?.avatarKey) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(createDownloadUrl(user.avatarKey, 60 * 60, user.avatarContentType ?? undefined), {
      status: 302,
      headers: { "Cache-Control": "private, max-age=300", "Referrer-Policy": "no-referrer" },
    });
  } catch (error) {
    console.error("Avatar lookup failed:", error);
    return new NextResponse(null, { status: 500 });
  }
}
