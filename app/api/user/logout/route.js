// app/api/user/logout/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Clear cookie by setting empty value and maxAge 0
    cookieStore.set({
      name: "token",
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (err) {
    console.error("POST /api/user/logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
