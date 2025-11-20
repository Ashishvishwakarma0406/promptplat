// File: app/api/user/logout/route.js
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.set({
      name: "token",
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });

    return Response.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Logout failed" }, { status: 500 });
  }
}


