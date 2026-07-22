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

  const task = tasks.find((currentTask) => currentTask.id === id);
  if (!task) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  if (taskData.status !== undefined) {
    task.status = taskData.status;
  }
  if (taskData.elapsedSeconds !== undefined) {
    task.elapsedSeconds = taskData.elapsedSeconds;
  }

  return Response.json(task);
}
