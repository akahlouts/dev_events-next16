import { Schema, model, models, Document } from "mongoose";

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
      maxlength: [500, "Overview cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be either online, offline, or hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one agenda item is required",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one tag is required",
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook for slug generation and data normalization
EventSchema.pre("save", function (next) {
  const event = this as IEvent;

  // Generate slug only if title changed or document is new
  if (event.isModified("title") || event.isNew) {
    event.slug = generateSlug(event.title);
  }

  // Normalize date to ISO format if it's not already
  if (event.isModified("date")) {
    event.date = normalizeDate(event.date);
  }

  // Normalize time format (HH:MM)
  if (event.isModified("time")) {
    event.time = normalizeTime(event.time);
  }

  next();
});

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to normalize date to ISO format
function normalizeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
}

// Helper function to normalize time format
function normalizeTime(timeString: string): string {
  // Handle various time formats and convert to HH:MM (24-hour format)
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);

  if (!match) {
    throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM");
  }

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[4]?.toUpperCase();

  if (period) {
    // Convert 12-hour to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  if (
    hours < 0 ||
    hours > 23 ||
    parseInt(minutes) < 0 ||
    parseInt(minutes) > 59
  ) {
    throw new Error("Invalid time values");
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;

/* 
  Prompt - Mogoose (Models): 
  You are a backend developer working on a Next.js application with Mongoose and TypeScript. Your task is to build a database layer with two Mongoose models, `Event` and `Booking` in a new `database` folder.

📁 You must create exactly three files:

1. `event.model.ts`
2. `booking.model.ts`
3. `index.ts`

1. `database/event.model.ts`

Create a strongly typed Mongoose schema and model called Event with the following fields:

- `title` – string, required
- `slug` – string, unique, auto-generated from title
- `description` – string, required
- `overview` – string, required
- `image` – string, required
- `venue` – string, required
- `location` – string, required
- `date` – string, required
- `time` – string, required
- `mode` – string (e.g., online, offline, hybrid), required
- `audience` – string, required
- `agenda` – array of strings, required
- `organizer` – string, required
- `tags` – array of strings, required
- `createdAt` – date, auto-generated
- `updatedAt` – date, auto-generated

Requirements:

- Use a pre-save hook to automatically generate a URL-friendly slug from the title.
- Only regenerate the slug if the title changes.
- In the same pre-save hook, validate and normalize the `date` to ISO format and ensure `time` is stored in a consistent format.
- Validate that required fields are present and non-empty.
- Add a unique index to the slug.
- Enable automatic timestamps.
- Use strict TypeScript types (no `any`).
- Write concise comments explaining key logic such as slug generation, date formatting, and validation.

2. `database/booking.model.ts`

Create a strongly typed Mongoose schema and model called Booking with the following fields:

- `eventId` – ObjectId (reference to `Event`), required
- `email` – string, required, must be a valid email
- `createdAt` – date, auto-generated
- `updatedAt` – date, auto-generated

Requirements:

- In a pre-save hook, verify that the referenced `eventId` corresponds to an existing `Event`. Throw an error if the event does not exist.
- Validate that `email` is properly formatted.
- Add an index on `eventId` for faster queries.
- Enable automatic timestamps.
- Use strong TypeScript types throughout.
- Include concise comments explaining pre-save validation and schema design decisions.

3. `database/index.ts`

- Export both `Event` and `Booking` models so they can be imported anywhere in the application from a single file.

---

✅ Final Deliverable:

- Exactly three files: `event.model.ts`, `booking.model.ts`, and `index.ts`.
- Each model must use pre-save hooks for slug generation, date normalization, and reference validation.
- Code should be production-grade, clean, type-safe, and clear to understand.
- Include only meaningful, concise comments — no unnecessary explanations.

  
*/
