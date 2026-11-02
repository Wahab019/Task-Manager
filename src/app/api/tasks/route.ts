import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse, TaskRecord } from "./response";

/**
 * Type definitions for task properties.
 */
type Priority = "low" | "normal" | "high";
type Status = "todo" | "in_progress" | "done";

/**
 * Type guard to check whether the provided value is a valid Priority.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Priority
 */
function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

/**
 * Type guard to check whether the provided value is a valid Status.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Status
 */
function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
}

/**
 * Handles GET requests to retrieve all tasks for the authenticated user via SQL.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Executes a parameterized SQL query on SQLite database.
 * 3. Maps the SQL rows to the standardized `TaskResponse` shape.
 * 4. Returns the JSON list of tasks.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const statement = db.prepare<[string], TaskRecord>(`
      SELECT 
        id, 
        title, 
        description, 
        priority, 
        status, 
        estimatedMinutes, 
        deadline, 
        elapsedSeconds, 
        assigned_to, 
        updatedAt, 
        createdAt
      FROM tasks
      WHERE assigned_to = ?
      ORDER BY updatedAt DESC
    `);

    const rows = statement.all(user.authUserId);
    return Response.json(rows.map(toTaskResponse));
  } catch (error) {
    console.error("Failed to list tasks from SQLite:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Handles POST requests to create a new task using SQL INSERT.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Validates the request body for required fields (title, description, priority, status).
 * 3. Formats optional fields (estimatedMinutes, deadline).
 * 4. Inserts a new task row into SQLite using parameterized SQL.
 * 5. Returns the newly created task.
 *
 * @param request - The incoming HTTP request containing the new task data
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "A title, description, priority, and status are required." },
      { status: 400 },
    );
  }

  const taskData = body as Record<string, unknown>;
  if (
    !isPriority(taskData.priority) ||
    !isStatus(taskData.status) ||
    typeof taskData.title !== "string" ||
    !taskData.title.trim() ||
    typeof taskData.description !== "string" ||
    !taskData.description.trim()
  ) {
    return Response.json(
      { error: "A title, description, priority, and status are required." },
      { status: 400 },
    );
  }

  const estimatedMinutes =
    typeof taskData.estimatedMinutes === "number" &&
    Number.isFinite(taskData.estimatedMinutes) &&
    taskData.estimatedMinutes > 0
      ? taskData.estimatedMinutes
      : null;

  const validatedFields = {
    title: taskData.title.trim(),
    description: taskData.description.trim(),
    priority: taskData.priority,
    status: taskData.status,
    estimatedMinutes,
    deadline:
      typeof taskData.deadline === "string" && taskData.deadline.trim()
        ? taskData.deadline.trim()
        : null,
  };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const insertStatement = db.prepare(`
      INSERT INTO tasks (
        id,
        title,
        description,
        priority,
        status,
        estimatedMinutes,
        deadline,
        elapsedSeconds,
        assigned_to,
        updatedAt,
        createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertStatement.run(
      id,
      validatedFields.title,
      validatedFields.description,
      validatedFields.priority,
      validatedFields.status,
      validatedFields.estimatedMinutes,
      validatedFields.deadline,
      0,
      user.authUserId,
      now,
      now,
    );

    const createdTask = db
      .prepare<[string], TaskRecord>("SELECT * FROM tasks WHERE id = ?")
      .get(id);

    if (!createdTask) {
      throw new Error("Created task could not be retrieved");
    }

    return Response.json(toTaskResponse(createdTask), {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create task with SQLite:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
