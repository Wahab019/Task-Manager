/**
 * Defines the public shape of a Task object returned by the API.
 * This is the interface that the frontend application consumes.
 */
export type TaskResponse = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  status: "todo" | "in_progress" | "done";
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  $updatedAt: string;
};

export type TaskRecord = {
  id?: string;
  $id?: string;
  title: string;
  description: string;
  priority: TaskResponse["priority"];
  status: TaskResponse["status"];
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  updatedAt?: string;
  $updatedAt?: string;
};

/**
 * Converts a database task row/document into the standardized frontend TaskResponse shape.
 *
 * @param doc - The task record from SQLite or Appwrite
 * @returns The formatted task response object
 */
export function toTaskResponse(doc: TaskRecord): TaskResponse {
  return {
    id: doc.id || doc.$id || "",
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    status: doc.status,
    estimatedMinutes: doc.estimatedMinutes,
    deadline: doc.deadline,
    elapsedSeconds: doc.elapsedSeconds,
    $updatedAt: doc.updatedAt || doc.$updatedAt || new Date().toISOString(),
  };
}
