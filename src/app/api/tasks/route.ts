import { ID, Query } from "node-appwrite";

import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse } from "./response";

/**
 * Type definitions for task properties.
 */
type Priority = "low" | "normal" | "high";
type Status = "todo" | "in_progress" | "done";

/**
 * Represents the structure of a Task document as stored in the Appwrite database.
 */
type TaskDocument = {
  $id: string;
  $updatedAt: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  assigned_to: string;
};

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
 * Handles GET requests to retrieve all tasks for the authenticated user.
 *
 * Flow:
 * 1. Authenticates the user.
 * 2. Queries the Appwrite database for tasks assigned to the user's ID.
 * 3. Maps the raw database documents to the public `Task` response format.
 * 4. Returns the JSON list of tasks.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let result;
  try {
    result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TASKS, [
      Query.equal("assigned_to", user.authUserId),
    ]);
  } catch (error) {
    console.error("Failed to list tasks:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(
    result.documents.map((doc) =>
      toTaskResponse(doc as unknown as TaskDocument),
    ),
  );
}

/**
 * Handles POST requests to create a new task.
 *
 * Flow:
 * 1. Authenticates the user.
 * 2. Validates the request body for required fields (title, description, priority, status).
 * 3. Formats optional fields (estimatedMinutes, deadline).
 * 4. Creates a new task document in the Appwrite database assigned to the user.
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

  let createdTask;
  try {
    createdTask = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      ID.unique(),
      {
        ...validatedFields,
        assigned_to: user.authUserId,
        elapsedSeconds: 0,
      },
    );
  } catch (error) {
    console.error("Failed to create task:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(toTaskResponse(createdTask as unknown as TaskDocument), {
    status: 201,
  });
}
