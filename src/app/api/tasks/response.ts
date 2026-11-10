export type Priority = "low" | "normal" | "high";
export type Status = "todo" | "in_progress" | "done";

export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

export function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
}

/**
 * Defines the public shape of a Task object returned by the API.
 * This is the interface that the frontend application consumes.
 */
export type TaskResponse = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
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
  priority: Priority;
  status: Status;
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
