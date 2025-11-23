// app/api/user/logout/route.js
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
    return new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
  } catch (err) {
    console.error("POST /api/user/logout error:", err);
    return new Response(JSON.stringify({ error: "Logout failed" }), { status: 500 });
  }
}
