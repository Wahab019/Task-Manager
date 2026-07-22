import { randomUUID } from "node:crypto";

import { isPriority, isStatus, tasks, type Task } from "./store";

export function GET() {
  return Response.json(tasks);
}

export async function POST(request: Request) {
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

  const task: Task = {
    id: randomUUID(),
    title: taskData.title.trim(),
    description: taskData.description.trim(),
    priority: taskData.priority,
    status: taskData.status,
    time: typeof taskData.time === "string" ? taskData.time.trim() : "",
    elapsedSeconds: 0,
  };

  tasks.push(task);
  return Response.json(task, { status: 201 });
}
