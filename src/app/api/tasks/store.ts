export type Priority = "low" | "normal" | "high";
export type Status = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  time: string;
  elapsedSeconds: number;
};

export const tasks: Task[] = [];

export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

export function isStatus(value: unknown): value is Status {
  return value === "todo" || value === "in_progress" || value === "done";
}
