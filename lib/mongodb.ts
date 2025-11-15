import mongoose from "mongoose";

// Define the connection cache type
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Extend the global object to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cache on the global object to persist across hot reloads in development
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connects to MongoDB via Mongoose and caches the connection to avoid creating multiple connections during development hot reloads.
 *
 * @returns The connected Mongoose instance
 * @throws Error if `MONGODB_URI` is not defined in the environment
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Return existing connection promise if one is in progress
  if (!cached.promise) {
    // Validate MongoDB URI exists
    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    }
    const options = {
      bufferCommands: false, // Disable Mongoose buffering
    };

    // Create a new connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    // Wait for the connection to establish
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on error to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;

/* 
  Prompt - Mogoose (DB Connect): 
  You are a backend developer working on a Next.js application with Mongoose and TypeScript. 

Your task is to,
- Create a new file `lib/mongodb.ts` in the lib folder of a Next.js application. 
- Set up a Mongoose database connection to MongoDB using TypeScript with proper types (avoid using any). 
- Cache the connection to prevent multiple connections during development. 
- Write clear and concise comments explaining key parts of the code. 
- Make sure the code is clean, readable, and production-ready.
*/