import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse } from "../response";

type Status = "todo" | "in_progress" | "done";
type TaskDocument = {
  $id: string;
  $updatedAt: string;
  status: Status;
  elapsedSeconds: number;
  assigned_to: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  estimatedMinutes: number | null;
  deadline: string | null;
};

function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
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
  } = {};

  if (taskData.status !== undefined) {
    validatedUpdates.status = taskData.status;
  }

  if (taskData.elapsedSeconds !== undefined) {
    validatedUpdates.elapsedSeconds = Math.round(
      Number(taskData.elapsedSeconds),
    );
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
