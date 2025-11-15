import mongoose from "mongoose";

// Define the connection cache type
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Extend the global object to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cache on the global object to persist across hot reloads
let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Uses a global cache to prevent multiple connections during development.
 */
async function connectDB(): Promise<typeof mongoose> {
  // If the connection already exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If no existing connection promise, create one
  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    }

    const options = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    // Wait for the connection
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the cache on error to allow retries
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
