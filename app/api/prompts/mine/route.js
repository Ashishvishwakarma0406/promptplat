import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import Prompt from '@/models/prompt';
import { getUserIdFromRequest } from '@/lib/authHelper';
import mongoose from 'mongoose';

/**
 * GET /api/prompts/mine
 * Fetches ALL prompts (public and private) for the currently authenticated user.
 */
export async function GET(request) {
  try {
    await dbConnect();

    // 1. --- Authentication ---
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. --- Fetch Prompts ---
    // Convert userId to ObjectId for proper query
    const prompts = await Prompt.find({ owner: new mongoose.Types.ObjectId(userId) })
      .populate('owner', 'name username') // Added populate to get owner info
      .sort({ createdAt: -1 }); // Show newest first

    return NextResponse.json({ prompts }, { status: 200 });

  } catch (error) {
    console.error('GET /api/prompts/mine Error:', error);
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred.' 
    }, { status: 500 });
  }
}

