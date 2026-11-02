import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Represents the structure of a TimeLog record stored in SQLite.
 */
type TimeLogRow = {
  id: string;
  taskId: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
  createdAt: string;
};

/**
 * Converts a database timelog row into the standardized frontend response shape.
 *
 * @param row - The raw timelog row from SQLite
 * @returns The formatted timelog response object
 */
function toTimeLogResponse(row: TimeLogRow) {
  return {
    id: row.id,
    taskId: row.taskId,
    userId: row.userId,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration,
  };
}

/**
 * Handles GET requests to retrieve all timelogs for the authenticated user via SQL.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Executes a parameterized SQL SELECT query on SQLite database.
 * 3. Maps rows to the standardized response format.
 * 4. Returns the JSON list of timelogs, ordered newest first.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const statement = db.prepare<[string], TimeLogRow>(`
      SELECT 
        id, 
        taskId, 
        userId, 
        startTime, 
        endTime, 
        duration, 
        createdAt
      FROM timelogs
      WHERE userId = ?
      ORDER BY startTime DESC
    `);

    const rows = statement.all(user.authUserId);
    return Response.json(rows.map(toTimeLogResponse));
  } catch (error) {
    console.error("Failed to list timelogs via SQL:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Handles POST requests to create a new timelog entry via SQL.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Validates request payload (taskId, startTime, endTime, duration).
 * 3. Supports idempotent client-provided `clientId`.
 * 4. Inserts the timelog into SQLite using parameterized SQL INSERT.
 * 5. Returns the created timelog (or existing one if duplicate detected).
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

  const rawClientId =
    typeof timeLogData.clientId === "string" ? timeLogData.clientId.trim() : "";
  const id =
    rawClientId && /^[a-zA-Z0-9._-]{1,36}$/.test(rawClientId)
      ? rawClientId
      : crypto.randomUUID();

  // Deduplication check if client ID was provided
  if (rawClientId) {
    const existing = db
      .prepare<[string], TimeLogRow>("SELECT * FROM timelogs WHERE id = ?")
      .get(id);

    if (existing) {
      return Response.json(toTimeLogResponse(existing), { status: 200 });
    }
  }

  const now = new Date().toISOString();
  const startTime = Math.round(timeLogData.startTime);
  const endTime = Math.round(timeLogData.endTime);
  const duration = Math.round(timeLogData.duration);
  const taskId = timeLogData.taskId.trim();

  try {
    db.prepare(
      `
      INSERT INTO timelogs (
        id, 
        taskId, 
        userId, 
        startTime, 
        endTime, 
        duration, 
        createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `,
    ).run(id, taskId, user.authUserId, startTime, endTime, duration, now);

    const created = db
      .prepare<[string], TimeLogRow>("SELECT * FROM timelogs WHERE id = ?")
      .get(id);

    if (!created) {
      throw new Error("Created timelog could not be retrieved");
    }

    return Response.json(toTimeLogResponse(created), { status: 201 });
  } catch (error) {
    console.error("Failed to insert timelog via SQL:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
