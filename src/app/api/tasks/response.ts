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

// Converts an Appwrite task document into the frontend task response shape.
// It normalizes optional fields and metadata names.
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
