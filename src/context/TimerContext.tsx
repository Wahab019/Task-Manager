/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
"use client";

import axios, { AxiosError } from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getAuthHeader } from "@/lib/appwrite";

export type Priority = "low" | "normal" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  $updatedAt?: string;
};

export type TimeLogEntry = {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  duration: number;
};

type PersistedTimerState = {
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  currentEntryStartTime: number | null;
  currentEntryId: string | null;
  isTracking: boolean;
  currentSeconds: number;
  persistedAt: number;
};

interface TimerContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  currentEntryStartTime: number | null;
  isTracking: boolean;
  currentSeconds: number;
  timelogs: TimeLogEntry[];
  timeLogs: TimeLogEntry[];
  addTask: (draft: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
    deadline: string | null;
  }) => Promise<void>;
  startTimer: (taskId: string, taskTitle: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (taskId?: string) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  stopTask: (taskId: string) => Promise<void>;
  pauseActiveTask: () => Promise<void>;
  resumeActiveTask: () => Promise<void>;
  stopActiveTask: (taskId?: string) => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    newStatus: Task["status"],
  ) => Promise<void>;
  getTotalDurationForTask: (taskId: string) => number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMING_STORAGE_KEY = "timer_state";
const TIMELOGS_STORAGE_KEY = "timer_timelogs";

function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createClosedEntry(taskId: string, startTime: number, endTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime,
    duration: Math.max(0, (endTime - startTime) / 1000),
  };
}

function createOpenEntry(taskId: string, startTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime: null,
    duration: 0,
  };
}

function isTemporaryTaskId(taskId: string) {
  return taskId.startsWith("temp-");
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);
  const [currentEntryStartTime, setCurrentEntryStartTime] = useState<
    number | null
  >(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [timelogs, setTimelogs] = useState<TimeLogEntry[]>([]);
  const [hasHydratedLogs, setHasHydratedLogs] = useState(false);
  const [hasHydratedTimer, setHasHydratedTimer] = useState(false);

  const promoteTaskToInProgress = useCallback((taskId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "in_progress",
            }
          : task,
      ),
    );
  }, []);

  const persistTimerState = useCallback(() => {
    const payload: PersistedTimerState = {
      activeTaskId,
      activeTaskTitle,
      currentEntryStartTime,
      currentEntryId,
      isTracking,
      currentSeconds,
      persistedAt: Date.now(),
    };
    localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(payload));
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryStartTime,
    currentEntryId,
    currentSeconds,
    isTracking,
  ]);

  const persistTimelogs = useCallback(() => {
    if (hasHydratedLogs) {
      localStorage.setItem(TIMELOGS_STORAGE_KEY, JSON.stringify(timelogs));
    }
  }, [hasHydratedLogs, timelogs]);

  useEffect(() => {
    const saved = localStorage.getItem(TIMELOGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TimeLogEntry[];
        // Hydrate saved logs from localStorage on first client render.
        setTimelogs(parsed);
      } catch (e) {
        console.error("Failed to parse saved time logs:", e);
      }
    }
    // Mark hydration complete so persistence can start.
    setHasHydratedLogs(true);
  }, []);

  useEffect(() => {
    persistTimelogs();
  }, [persistTimelogs]);

  const syncTaskElapsedSeconds = useCallback(
    (taskId: string, extraDuration = 0) => {
      const totalSeconds =
        timelogs
          .filter((log) => log.taskId === taskId && log.endTime !== null)
          .reduce((sum, log) => sum + log.duration, 0) + extraDuration;

      const normalized = Math.floor(totalSeconds);
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, elapsedSeconds: normalized } : task,
        ),
      );
      return normalized;
    },
    [timelogs],
  );

  const closeCurrentEntry = useCallback(
    (endTime = Date.now()) => {
      if (!activeTaskId || !currentEntryStartTime || !currentEntryId) {
        return null;
      }

      const closedEntry = {
        id: currentEntryId,
        taskId: activeTaskId,
        startTime: currentEntryStartTime,
        endTime,
        duration: Math.max(0, (endTime - currentEntryStartTime) / 1000),
      } satisfies TimeLogEntry;

      setTimelogs((current) => {
        const filtered = current.filter((log) => log.id !== currentEntryId);
        return [...filtered, closedEntry];
      });

      setCurrentEntryStartTime(null);
      setCurrentEntryId(null);
      setIsTracking(false);
      return closedEntry;
    },
    [activeTaskId, currentEntryId, currentEntryStartTime],
  );

  const clearActiveTimer = useCallback(() => {
    setActiveTaskId(null);
    setActiveTaskTitle(null);
    setCurrentEntryStartTime(null);
    setCurrentEntryId(null);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(TIMING_STORAGE_KEY);
    if (!saved) {
      // No saved timer state to restore.
      setHasHydratedTimer(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as PersistedTimerState;
      if (
        parsed.activeTaskId &&
        parsed.currentEntryStartTime &&
        parsed.currentEntryId
      ) {
        const closedEntry = createClosedEntry(
          parsed.activeTaskId,
          parsed.currentEntryStartTime,
          parsed.persistedAt || Date.now(),
        );
        closedEntry.id = parsed.currentEntryId;

        setTimelogs((current) => {
          const filtered = current.filter((log) => log.id !== closedEntry.id);
          return [...filtered, closedEntry];
        });
        // A tab close is equivalent to Pause: retain the task as resumable.
        setActiveTaskId(parsed.activeTaskId);
        setActiveTaskTitle(parsed.activeTaskTitle);
        setCurrentEntryStartTime(null);
        setCurrentEntryId(null);
        setIsTracking(false);
        setCurrentSeconds(
          parsed.currentSeconds ?? Math.floor(closedEntry.duration),
        );
      } else {
        // Restore a paused timer exactly as it was persisted.
        setActiveTaskId(parsed.activeTaskId);
        setActiveTaskTitle(parsed.activeTaskTitle);
        setCurrentEntryStartTime(parsed.currentEntryStartTime);
        setCurrentEntryId(parsed.currentEntryId);
        setIsTracking(parsed.isTracking);
        setCurrentSeconds(parsed.currentSeconds ?? 0);
      }
    } catch (e) {
      console.error("Failed to parse saved timer state:", e);
      localStorage.removeItem(TIMING_STORAGE_KEY);
    } finally {
      // Allow normal persistence after the initial restore pass.
      setHasHydratedTimer(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedTimer) return;
    if (activeTaskId && activeTaskTitle !== null) {
      persistTimerState();
    } else {
      localStorage.removeItem(TIMING_STORAGE_KEY);
    }
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryId,
    currentEntryStartTime,
    currentSeconds,
    hasHydratedTimer,
    isTracking,
    persistTimerState,
  ]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isTracking && currentEntryStartTime) {
      intervalId = setInterval(() => {
        // Keep the accumulated task duration fresh while this segment runs.
        setCurrentSeconds((seconds) => seconds + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, currentEntryStartTime]);

  const evictTask = useCallback(
    (taskId: string) => {
      setTasks((current) => current.filter((t) => t.id !== taskId));
      if (taskId === activeTaskId) {
        clearActiveTimer();
        localStorage.removeItem(TIMING_STORAGE_KEY);
      }
    },
    [activeTaskId, clearActiveTimer],
  );

  const activeTaskIdRef = React.useRef<string | null>(activeTaskId);
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  const validateAndSync = useCallback(
    (fetchedTasks: Task[]) => {
      setTasks((current) => {
        const currentById = new Map(current.map((task) => [task.id, task]));
        return fetchedTasks.map((task) => {
          const existing = currentById.get(task.id);
          if (!existing) {
            return task;
          }

          if (existing.status !== task.status) {
            return {
              ...task,
              status: existing.status,
              elapsedSeconds: existing.elapsedSeconds,
            };
          }

          return {
            ...task,
            elapsedSeconds: existing.elapsedSeconds,
          };
        });
      });
      const currentActive = activeTaskIdRef.current;
      if (currentActive && !isTemporaryTaskId(currentActive)) {
        const stillExists = fetchedTasks.some((t) => t.id === currentActive);
        if (!stillExists) {
          clearActiveTimer();
          localStorage.removeItem(TIMING_STORAGE_KEY);
        }
      }
    },
    [clearActiveTimer],
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchTasks() {
      try {
        const response = await axios.get<Task[]>("/api/tasks", {
          headers: await getAuthHeader(),
        });
        if (!isMounted) return;
        validateAndSync(response.data);
      } catch {
        if (isMounted) setError("Couldn't load tasks. Try refreshing.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, [validateAndSync]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await axios.get<Task[]>("/api/tasks", {
          headers: await getAuthHeader(),
        });
        validateAndSync(response.data);
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [validateAndSync]);

  const addTask = async (draft: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
    deadline: string | null;
  }) => {
    const tempId = `temp-${Date.now()}`;
    const parsedMinutes = Number(draft.time);
    const optimisticTask: Task = {
      id: tempId,
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      status: "todo",
      estimatedMinutes:
        draft.time.trim() && Number.isFinite(parsedMinutes) && parsedMinutes > 0
          ? parsedMinutes
          : null,
      deadline: draft.deadline,
      elapsedSeconds: 0,
      $updatedAt: new Date().toISOString(),
    };
    setTasks((current) => [...current, optimisticTask]);

    try {
      const response = await axios.post<Task>(
        "/api/tasks",
        {
          priority: draft.priority,
          title: draft.title,
          description: draft.description,
          estimatedMinutes: optimisticTask.estimatedMinutes,
          deadline: draft.deadline,
          status: "todo",
        },
        { headers: await getAuthHeader() },
      );
      setTasks((current) =>
        current.map((task) => {
          if (task.id !== tempId) return task;
          const isActiveTempTask = activeTaskId === tempId;
          return {
            ...response.data,
            status: isActiveTempTask ? "in_progress" : task.status,
            elapsedSeconds: task.elapsedSeconds,
          };
        }),
      );
      if (activeTaskId === tempId) {
        setActiveTaskId(response.data.id);
        setActiveTaskTitle(response.data.title);
        promoteTaskToInProgress(response.data.id);
        try {
          await axios.patch(
            `/api/tasks/${response.data.id}`,
            { status: "in_progress" },
            { headers: await getAuthHeader() },
          );
        } catch (e) {
          if ((e as AxiosError)?.response?.status === 404) {
            evictTask(response.data.id);
          }
        }
      }
    } catch {
      setTasks((current) => current.filter((task) => task.id !== tempId));
      setError("Couldn't create the task. Try again.");
    }
  };

  const startTimer = async (taskId: string, taskTitle: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      await pauseTimer();
    }

    const entry = createOpenEntry(taskId, Date.now());
    setActiveTaskId(taskId);
    setActiveTaskTitle(taskTitle);
    setCurrentEntryStartTime(entry.startTime);
    setCurrentEntryId(entry.id);
    setIsTracking(true);
    setCurrentSeconds(Math.floor(getTotalDurationForTask(taskId)));
    promoteTaskToInProgress(taskId);

    if (isTemporaryTaskId(taskId)) {
      return;
    }

    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status: "in_progress" },
        { headers: await getAuthHeader() },
      );
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to start timer:", e);
      }
    }
  };

  const pauseTimer = async () => {
    if (!activeTaskId || !activeTaskTitle) return;
    const taskId = activeTaskId;
    const closedEntry = closeCurrentEntry();
    if (!closedEntry) return;

    const totalSeconds = syncTaskElapsedSeconds(taskId, closedEntry.duration);
    setCurrentSeconds(totalSeconds);
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "in_progress",
              elapsedSeconds: Math.floor(totalSeconds),
            }
          : task,
      ),
    );

    if (isTemporaryTaskId(taskId)) {
      return;
    }

    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { elapsedSeconds: Math.floor(totalSeconds) },
        { headers: await getAuthHeader() },
      );
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to pause timer:", e);
      }
    }
  };

  const resumeTimer = async () => {
    if (!activeTaskId || !activeTaskTitle || currentEntryStartTime) return;
    const taskId = activeTaskId;
    const entry = createOpenEntry(taskId, Date.now());
    setCurrentEntryStartTime(entry.startTime);
    setCurrentEntryId(entry.id);
    setIsTracking(true);
    setCurrentSeconds(Math.floor(getTotalDurationForTask(taskId)));
    promoteTaskToInProgress(taskId);
  };

  const stopTimer = async (targetTaskId?: string) => {
    const taskIdToStop = targetTaskId || activeTaskId;
    if (!taskIdToStop) return;

    if (activeTaskId === taskIdToStop) {
      const closedEntry = closeCurrentEntry();
      const totalSeconds = closedEntry
        ? syncTaskElapsedSeconds(taskIdToStop, closedEntry.duration)
        : Math.floor(getTotalDurationForTask(taskIdToStop));

      clearActiveTimer();
      setCurrentSeconds(totalSeconds);
      setTasks((current) =>
        current.map((task) =>
          task.id === taskIdToStop
            ? {
                ...task,
                status: "done",
                elapsedSeconds: Math.floor(totalSeconds),
              }
            : task,
        ),
      );

      if (isTemporaryTaskId(taskIdToStop)) {
        return;
      }

      try {
        await axios.patch(
          `/api/tasks/${taskIdToStop}`,
          { status: "done", elapsedSeconds: totalSeconds },
          { headers: await getAuthHeader() },
        );
      } catch (e) {
        if ((e as AxiosError)?.response?.status !== 404) {
          console.error("Failed to stop task:", e);
        }
      }
    } else {
      const targetTask = tasks.find((t) => t.id === taskIdToStop);
      const totalSeconds = Math.floor(
        getTotalDurationForTask(taskIdToStop) ||
          (targetTask?.elapsedSeconds ?? 0),
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === taskIdToStop
            ? {
                ...task,
                status: "done",
                elapsedSeconds: totalSeconds,
              }
            : task,
        ),
      );

      if (isTemporaryTaskId(taskIdToStop)) {
        return;
      }

      try {
        await axios.patch(
          `/api/tasks/${taskIdToStop}`,
          { status: "done", elapsedSeconds: totalSeconds },
          { headers: await getAuthHeader() },
        );
      } catch (e) {
        if ((e as AxiosError)?.response?.status !== 404) {
          console.error("Failed to stop task:", e);
        }
      }
    }
  };

  const startTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    promoteTaskToInProgress(taskId);
    await startTimer(taskId, task.title);
  };

  const stopTask = async (taskId: string) => {
    await stopTimer(taskId);
  };

  const pauseActiveTask = pauseTimer;
  const resumeActiveTask = resumeTimer;
  const stopActiveTask = stopTimer;

  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"],
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousStatus = task.status;
    if (previousStatus === newStatus) return;
    if (previousStatus === "done") return;
    if (previousStatus === "in_progress" && newStatus === "todo") return;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    if (taskId === activeTaskId) {
      if (newStatus === "done") {
        await stopTimer();
        return;
      }
      if (newStatus === "todo") {
        await pauseTimer();
        return;
      }
    }

    if (isTemporaryTaskId(taskId)) {
      return;
    }

    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: await getAuthHeader() },
      );
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        setTasks((current) =>
          current.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t,
          ),
        );
        console.error("Failed to update status:", e);
      }
    }
  };

  const getTotalDurationForTask = useCallback(
    (taskId: string) =>
      timelogs
        .filter((log) => log.taskId === taskId && log.endTime !== null)
        .reduce((sum, log) => sum + log.duration, 0),
    [timelogs],
  );

  return (
    <TimerContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        activeTaskId,
        activeTaskTitle,
        currentEntryStartTime,
        isTracking,
        currentSeconds,
        timelogs,
        timeLogs: timelogs,
        addTask,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        startTask,
        stopTask,
        pauseActiveTask,
        resumeActiveTask,
        stopActiveTask,
        updateTaskStatus,
        getTotalDurationForTask,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
