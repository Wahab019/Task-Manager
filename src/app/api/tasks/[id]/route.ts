import { isStatus, tasks } from "../store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "A valid status is required." },
      { status: 400 },
    );
  }

  const taskData = body as Record<string, unknown>;
  if (!isStatus(taskData.status)) {
    return Response.json(
      { error: "A valid status is required." },
      { status: 400 },
    );
  }

  const task = tasks.find((currentTask) => currentTask.id === id);
  if (!task) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  task.status = taskData.status;
  return Response.json(task);
}
