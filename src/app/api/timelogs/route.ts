import { ID, Query } from "node-appwrite";

import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";

/**
 * Represents the structure of a TimeLog document as stored in the Appwrite database.
 * Tracks individual sessions of time spent on a specific task.
 */
type TimeLogDocument = {
  $id: string;
  taskId: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
};

/**
 * The number of timelogs to fetch per database query (pagination size).
 */
const PAGE_SIZE = 100;

/**
 * Converts a raw Appwrite timelog document into the standardized frontend response shape.
 * Strips Appwrite metadata the frontend does not need (like renaming `$id` to `id`).
 *
 * @param doc - The raw timelog document from Appwrite
 * @returns The formatted timelog response object
 */
function toTimeLogResponse(doc: TimeLogDocument) {
  return {
    id: doc.$id,
    taskId: doc.taskId,
    userId: doc.userId,
    startTime: doc.startTime,
    endTime: doc.endTime,
    duration: doc.duration,
  };
}

/**
 * Handles GET requests to retrieve all timelogs for the authenticated user.
 *
 * Flow:
 * 1. Authenticates the user.
 * 2. Fetches timelogs in pages (using cursor-based pagination) to bypass Appwrite limit.
 * 3. Maps all fetched documents to the public response format.
 * 4. Returns the JSON list of timelogs, ordered newest first.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const documents: TimeLogDocument[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const queries = [
        Query.equal("userId", user.authUserId),
        Query.orderDesc("startTime"),
        Query.limit(PAGE_SIZE),
      ];

      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TIMELOGS,
        queries,
      );

      const page = result.documents as unknown as TimeLogDocument[];
      documents.push(...page);
      cursor = page.at(-1)?.$id ?? null;
      hasMore = page.length === PAGE_SIZE && cursor !== null;
    }
  } catch (error) {
    console.error("Failed to list timelogs:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(documents.map((doc) => toTimeLogResponse(doc)));
}

/**
 * Handles POST requests to create a new timelog entry.
 *
 * Flow:
 * 1. Authenticates the user.
 * 2. Validates request payload (taskId, startTime, endTime, duration).
 * 3. Uses a client-provided `clientId` as the document ID if provided,
 *    preventing duplicate entries from network retries.
 * 4. Creates the timelog in the Appwrite database.
 * 5. Returns the created timelog (or the existing one if a duplicate was detected).
 *
 * @param request - The incoming HTTP request containing timelog data
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      {
        error: "taskId, startTime, endTime, and duration are required.",
      },
      { status: 400 },
    );
  }

  const timeLogData = body as Record<string, unknown>;

  if (
    typeof timeLogData.taskId !== "string" ||
    !timeLogData.taskId.trim() ||
    typeof timeLogData.startTime !== "number" ||
    !Number.isFinite(timeLogData.startTime) ||
    typeof timeLogData.endTime !== "number" ||
    !Number.isFinite(timeLogData.endTime) ||
    typeof timeLogData.duration !== "number" ||
    !Number.isFinite(timeLogData.duration) ||
    timeLogData.duration < 0
  ) {
    return Response.json(
      {
        error:
          "taskId must be a non-empty string and startTime, endTime, and duration must be valid numbers.",
      },
      { status: 400 },
    );
  }

  // If the client sent its own entry ID, use it as the Appwrite document ID.
  // This makes client ID == server ID so a subsequent GET /api/timelogs can
  // deduplicate by ID and never double-count a locally-held entry that raced
  // ahead of the server response (the root cause of the jump-on-resume bug).
  const rawClientId =
    typeof timeLogData.clientId === "string" ? timeLogData.clientId.trim() : "";
  // Appwrite document IDs: alphanumeric, hyphens, dots, underscores; 1–36 chars.
  const documentId =
    rawClientId && /^[a-zA-Z0-9._-]{1,36}$/.test(rawClientId)
      ? rawClientId
      : ID.unique();

  let createdTimeLog;
  try {
    createdTimeLog = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TIMELOGS,
      documentId,
      {
        taskId: timeLogData.taskId.trim(),
        userId: user.authUserId,
        startTime: Math.round(timeLogData.startTime),
        endTime: Math.round(timeLogData.endTime),
        duration: Math.round(timeLogData.duration),
      },
    );
  } catch (error) {
    // If the document already exists under this ID (e.g. a duplicate POST
    // caused by a network retry), fetch and return the existing document
    // instead of surfacing a 500 that would mislead the client.
    const appwriteErr = error as { code?: number; message?: string };
    const isAlreadyExists =
      appwriteErr?.code === 409 ||
      (appwriteErr?.message ?? "").toLowerCase().includes("already exists");

    if (rawClientId && isAlreadyExists) {
      try {
        const existing = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.TIMELOGS,
          documentId,
        );
        return Response.json(
          toTimeLogResponse(existing as unknown as TimeLogDocument),
          { status: 200 },
        );
      } catch {
        // fall through to the generic error response below
      }
    }

    console.error("Failed to create timelog:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(
    toTimeLogResponse(createdTimeLog as unknown as TimeLogDocument),
    { status: 201 },
  );
}
