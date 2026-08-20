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

/**
 * Represents the raw Task document structure as it comes from the Appwrite database.
 * Includes Appwrite-specific metadata fields like `$id` and `$updatedAt`.
 */
type AppwriteTaskDoc = {
  $id: string;
  title: string;
  description: string;
  priority: TaskResponse["priority"];
  status: TaskResponse["status"];
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  $updatedAt: string;
};

/**
 * Converts a raw Appwrite task document into the standardized frontend TaskResponse shape.
 *
 * - Maps Appwrite's internal `$id` to a clean `id` property.
 * - Passes through all other relevant data fields.
 *
 * @param doc - The raw task document from Appwrite
 * @returns The formatted task response object
 */
export function toTaskResponse(doc: AppwriteTaskDoc): TaskResponse {
  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    status: doc.status,
    estimatedMinutes: doc.estimatedMinutes,
    deadline: doc.deadline,
    elapsedSeconds: doc.elapsedSeconds,
    $updatedAt: doc.$updatedAt,
  };
}
