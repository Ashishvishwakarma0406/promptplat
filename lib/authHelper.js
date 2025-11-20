import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Extract user ID from request (for API routes)
 * @param {Request} request - The incoming request object (not used, but kept for API consistency)
 * @returns {Promise<string|null>} - User ID or null if not authenticated
 */
export async function getUserIdFromRequest(request) {
  try {
    // Get token from cookies
    // In Next.js 15, cookies() can be called directly in API routes
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }

    // Verify JWT
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure token contains user id
    if (!decoded || !decoded.id) {
      return null;
    }

    return String(decoded.id); // Ensure it's a string
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
}

