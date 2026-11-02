import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse, TaskRecord } from "../response";

/**
 * Type definitions for task properties.
 */
type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "normal" | "high";

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
 * Type guard to check whether the provided value is a valid Priority.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Priority
 */
function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

/**
 * Handles PATCH requests to update a specific task by ID using SQL.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Validates the request body and applies partial updates.
 * 3. Verifies that the task exists and belongs to the authenticated user via SQL SELECT.
 * 4. Updates the task in SQLite using parameterized SQL UPDATE.
 * 5. Returns the updated task response.
 *
 * @param request - The incoming HTTP request containing partial task updates
 * @param params - The route parameters containing the task ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "A valid status is required." },
      { status: 400 },
    );
  }

  const taskData = body as Record<string, unknown>;

  if (taskData.status !== undefined && !isStatus(taskData.status)) {
    return Response.json(
      { error: "A valid status is required." },
      { status: 400 },
    );
  }

  if (
    taskData.elapsedSeconds !== undefined &&
    typeof taskData.elapsedSeconds !== "number"
  ) {
    return Response.json(
      { error: "elapsedSeconds must be a number." },
      { status: 400 },
    );
  }

  if (
    taskData.title !== undefined &&
    (typeof taskData.title !== "string" || !taskData.title.trim())
  ) {
    return Response.json({ error: "A title is required." }, { status: 400 });
  }

  if (
    taskData.description !== undefined &&
    (typeof taskData.description !== "string" || !taskData.description.trim())
  ) {
    return Response.json(
      { error: "A description is required." },
      { status: 400 },
    );
  }

  if (taskData.priority !== undefined && !isPriority(taskData.priority)) {
    return Response.json(
      { error: "A valid priority is required." },
      { status: 400 },
    );
  }

  if (
    taskData.estimatedMinutes !== undefined &&
    taskData.estimatedMinutes !== null &&
    typeof taskData.estimatedMinutes !== "number"
  ) {
    return Response.json(
      { error: "estimatedMinutes must be a number." },
      { status: 400 },
    );
  }

  if (
    taskData.deadline !== undefined &&
    taskData.deadline !== null &&
    typeof taskData.deadline !== "string"
  ) {
    return Response.json(
      { error: "deadline must be a string." },
      { status: 400 },
    );
  }

  // Fetch the existing task using SQL
  const existingTask = db
    .prepare<[string], TaskRecord & { assigned_to: string }>(
      "SELECT * FROM tasks WHERE id = ?",
    )
    .get(id);

  if (!existingTask) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  if (existingTask.assigned_to !== user.authUserId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (taskData.status !== undefined) {
    updates.status = taskData.status;
  }

  if (taskData.elapsedSeconds !== undefined) {
    updates.elapsedSeconds = Math.round(Number(taskData.elapsedSeconds));
  }

  if (taskData.title !== undefined) {
    updates.title = taskData.title.trim();
  }

  if (taskData.description !== undefined) {
    updates.description = taskData.description.trim();
  }

  if (taskData.priority !== undefined) {
    updates.priority = taskData.priority;
  }

  if (taskData.estimatedMinutes !== undefined) {
    updates.estimatedMinutes =
      typeof taskData.estimatedMinutes === "number" &&
      Number.isFinite(taskData.estimatedMinutes) &&
      taskData.estimatedMinutes > 0
        ? taskData.estimatedMinutes
        : null;
  }

  if (taskData.deadline !== undefined) {
    updates.deadline =
      typeof taskData.deadline === "string" && taskData.deadline.trim()
        ? taskData.deadline.trim()
        : null;
  }

  updates.updatedAt = new Date().toISOString();

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = ?`);
    values.push(value);
  }

  values.push(id);
  values.push(user.authUserId);

  try {
    const updateSql = `
      UPDATE tasks 
      SET ${setClauses.join(", ")}
      WHERE id = ? AND assigned_to = ?
    `;

    db.prepare(updateSql).run(...values);

    const updatedTask = db
      .prepare<[string], TaskRecord>("SELECT * FROM tasks WHERE id = ?")
      .get(id);

    if (!updatedTask) {
      throw new Error("Updated task could not be retrieved");
    }

    return Response.json(toTaskResponse(updatedTask));
  } catch (error) {
    console.error("Failed to update task with SQL:", error);
    return Response.json(
      {
        error: "Failed to update task.",
      },
      { status: 500 },
    );
  }
}

/**
 * Handles DELETE requests to remove a specific task by ID using SQL.
 *
 * Flow:
 * 1. Authenticates the user with Appwrite session JWT.
 * 2. Fetches the task via SQL SELECT to ensure it exists and belongs to the user.
 * 3. Enforces business logic: only tasks that are "todo" (not started) can be deleted.
 * 4. Deletes the task row from SQLite using SQL DELETE.
 * 5. Returns a success confirmation.
 *
 * @param _request - The incoming HTTP request
 * @param params - The route parameters containing the task ID
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  // Retrieve existing task using SQL
  const existingTask = db
    .prepare<[string], TaskRecord & { assigned_to: string }>(
      "SELECT * FROM tasks WHERE id = ?",
    )
    .get(id);

  if (!existingTask) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  if (existingTask.assigned_to !== user.authUserId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  if (existingTask.status !== "todo") {
    return Response.json(
      { error: "Only tasks that haven't been started can be deleted." },
      { status: 400 },
    );
  }

  try {
    db.prepare("DELETE FROM tasks WHERE id = ? AND assigned_to = ?").run(
      id,
      user.authUserId,
    );
  } catch (error) {
    console.error("Failed to delete task via SQL:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
