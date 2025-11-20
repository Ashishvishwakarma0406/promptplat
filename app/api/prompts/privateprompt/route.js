import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import Prompt from '@/models/prompt';
import { getUserIdFromRequest } from '@/lib/authHelper';
import mongoose from 'mongoose';

/**
 * GET /api/prompts/privateprompt
 * Fetches ONLY private prompts for the currently authenticated user.
 * Also handles an 'owner' query param, but restricts it to the auth'd user.
 */
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('owner');

    // 1. --- Get Authenticated User ---
    const authUserId = await getUserIdFromRequest(request);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    let userIdToQuery = authUserId;

    // 2. --- Handle 'owner' Param ---
    // If an owner ID is provided, check that it matches the authenticated user.
    // This prevents one user from seeing another's private prompts.
    if (ownerId) {
      if (authUserId !== ownerId) {
        return NextResponse.json({ error: 'Forbidden. You can only view your own private prompts.' }, { status: 403 });
      }
      userIdToQuery = ownerId;
    }

    // 3. --- Fetch Prompts ---
    const prompts = await Prompt.find({ 
      owner: new mongoose.Types.ObjectId(userIdToQuery), 
      visibility: 'private' 
    })
      .populate('owner', 'name username') // Added populate
      .sort({ createdAt: -1 }); // Show newest first

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (error) {
    console.error('GET /api/prompts/privateprompt Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}