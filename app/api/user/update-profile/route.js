import dbConnect from "../../../../lib/dbconnect";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    await dbConnect();

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: "Email, password, and name are required." }),
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found." }),
        { status: 404 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid password." }),
        { status: 401 }
      );
    }

    // Update name
    user.name = name;
    await user.save();

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully.",
        user: { email: user.email, name: user.name },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Update Profile Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
