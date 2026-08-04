import { ID, Query } from "node-appwrite";

import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";
import { toTaskResponse } from "./response";

type Priority = "low" | "normal" | "high";
type Status = "todo" | "in_progress" | "done";
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

function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
}

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
