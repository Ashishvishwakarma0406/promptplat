import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbconnect";
import User from "@/models/user";

export async function GET() {
  try {
    await dbConnect();

    // ✅ Get JWT token from cookies - await cookies() in Next.js 15+
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ user: null }, { status: 401 });
    }

    // ✅ Verify token safely
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return Response.json({ user: null }, { status: 401 });
    }

    if (!decoded?.id) {
      return Response.json({ user: null }, { status: 401 });
    }

    // ✅ Fetch user with limited fields
    const user = await User.findById(decoded.id).select(
      "_id email username name role phoneNo"
    );

    if (!user) {
      return Response.json({ user: null }, { status: 404 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/user/me:", error.message);
    return Response.json({ user: null }, { status: 500 });
  }
}
