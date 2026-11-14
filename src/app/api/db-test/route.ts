
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectDB();

    await mongoose.connection.db!.admin().ping();

    return NextResponse.json({
      success: true,
      message: "Hall of FaZe connected to MongoDB!",
      database: mongoose.connection.db?.databaseName,
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}
