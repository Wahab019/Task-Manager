import { ID, Query } from "node-appwrite";

import { databases } from "@/lib/appwrite-server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-config";
import { getCurrentUser } from "@/lib/auth";

type TimeLogDocument = {
  $id: string;
  taskId: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
};

const PAGE_SIZE = 100;

function toTimeLogResponse(doc: TimeLogDocument) {
  return {
    id: doc.$id,
    taskId: doc.taskId,
    userId: doc.userId,
    startTime: doc.startTime,
    endTime: doc.endTime,
    duration: doc.duration,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const documents: TimeLogDocument[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const queries = [
        Query.equal("userId", user.authUserId),
        Query.orderDesc("startTime"),
        Query.limit(PAGE_SIZE),
      ];

      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TIMELOGS,
        queries,
      );

      const page = result.documents as unknown as TimeLogDocument[];
      documents.push(...page);
      cursor = page.at(-1)?.$id ?? null;
      hasMore = page.length === PAGE_SIZE && cursor !== null;
    }
  } catch (error) {
    console.error("Failed to list timelogs:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(documents.map((doc) => toTimeLogResponse(doc)));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      {
        error: "taskId, startTime, endTime, and duration are required.",
      },
      { status: 400 },
    );
  }

  const timeLogData = body as Record<string, unknown>;

  if (
    typeof timeLogData.taskId !== "string" ||
    !timeLogData.taskId.trim() ||
    typeof timeLogData.startTime !== "number" ||
    !Number.isFinite(timeLogData.startTime) ||
    typeof timeLogData.endTime !== "number" ||
    !Number.isFinite(timeLogData.endTime) ||
    typeof timeLogData.duration !== "number" ||
    !Number.isFinite(timeLogData.duration) ||
    timeLogData.duration < 0
  ) {
    return Response.json(
      {
        error:
          "taskId must be a non-empty string and startTime, endTime, and duration must be valid numbers.",
      },
      { status: 400 },
    );
  }

  let createdTimeLog;
  try {
    createdTimeLog = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TIMELOGS,
      ID.unique(),
      {
        taskId: timeLogData.taskId.trim(),
        userId: user.authUserId,
        startTime: Math.round(timeLogData.startTime),
        endTime: Math.round(timeLogData.endTime),
        duration: Math.round(timeLogData.duration),
      },
    );
  } catch (error) {
    console.error("Failed to create timelog:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return Response.json(
    toTimeLogResponse(createdTimeLog as unknown as TimeLogDocument),
    { status: 201 },
  );
}
