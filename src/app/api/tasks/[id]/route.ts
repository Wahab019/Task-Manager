import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse } from "../response";

type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "normal" | "high";
type TaskDocument = {
  $id: string;
  $updatedAt: string;
  status: Status;
  elapsedSeconds: number;
  assigned_to: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedMinutes: number | null;
  deadline: string | null;
};

function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
}

function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

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

  let existingTask;
  try {
    existingTask = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      id,
    );
  } catch {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const taskDocument = existingTask as unknown as TaskDocument;

  if (taskDocument.assigned_to !== user.authUserId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const validatedUpdates: {
    status?: "todo" | "in_progress" | "done";
    elapsedSeconds?: number;
    title?: string;
    description?: string;
    priority?: Priority;
    estimatedMinutes?: number | null;
    deadline?: string | null;
  } = {};

  if (taskData.status !== undefined) {
    validatedUpdates.status = taskData.status;
  }

  if (taskData.elapsedSeconds !== undefined) {
    validatedUpdates.elapsedSeconds = Math.round(
      Number(taskData.elapsedSeconds),
    );
  }

  if (taskData.title !== undefined) {
    validatedUpdates.title = taskData.title.trim();
  }

  if (taskData.description !== undefined) {
    validatedUpdates.description = taskData.description.trim();
  }

  if (taskData.priority !== undefined) {
    validatedUpdates.priority = taskData.priority;
  }

  if (taskData.estimatedMinutes !== undefined) {
    validatedUpdates.estimatedMinutes =
      typeof taskData.estimatedMinutes === "number" &&
      Number.isFinite(taskData.estimatedMinutes) &&
      taskData.estimatedMinutes > 0
        ? taskData.estimatedMinutes
        : null;
  }

  if (taskData.deadline !== undefined) {
    validatedUpdates.deadline =
      typeof taskData.deadline === "string" && taskData.deadline.trim()
        ? taskData.deadline.trim()
        : null;
  }

  let updatedTask;
  try {
    updatedTask = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      id,
      validatedUpdates,
    );
  } catch (error) {
    console.error("Failed to update task document:", error);
    return Response.json(
      {
        error:
          "Failed to update task. Database connection timed out or failed.",
      },
      { status: 500 },
    );
  }

  return Response.json(toTaskResponse(updatedTask as unknown as TaskDocument));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  let existingTask;
  try {
    existingTask = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      id,
    );
  } catch {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const taskDocument = existingTask as unknown as TaskDocument;

  if (taskDocument.assigned_to !== user.authUserId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  if (taskDocument.status !== "todo") {
    return Response.json(
      { error: "Only tasks that haven't been started can be deleted." },
      { status: 400 },
    );
  }

  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TASKS, id);
  } catch (error) {
    console.error("Failed to delete task document:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
