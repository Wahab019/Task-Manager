/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
"use client";

import axios, { AxiosError } from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Priority = "low" | "normal" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
  time: string;
  elapsedSeconds: number;
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
  }) => Promise<void>;
  startTimer: (taskId: string, taskTitle: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  pauseActiveTask: () => Promise<void>;
  resumeActiveTask: () => Promise<void>;
  stopActiveTask: () => Promise<void>;
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
  const [timelogs, setTimelogs] = useState<TimeLogEntry[]>([]);
  const [hasHydratedLogs, setHasHydratedLogs] = useState(false);
  const [hasHydratedTimer, setHasHydratedTimer] = useState(false);
  const [tick, setTick] = useState(0);

  const currentSeconds = useMemo(() => {
    if (!isTracking || !currentEntryStartTime) return 0;
    return Math.max(0, Math.floor((tick - currentEntryStartTime) / 1000));
  }, [currentEntryStartTime, isTracking, tick]);

  const persistTimerState = useCallback(() => {
    const payload: PersistedTimerState = {
      activeTaskId,
      activeTaskTitle,
      currentEntryStartTime,
      currentEntryId,
      isTracking,
      persistedAt: Date.now(),
    };
    localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(payload));
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryStartTime,
    currentEntryId,
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
        setActiveTaskId(null);
        setActiveTaskTitle(null);
        setCurrentEntryStartTime(null);
        setCurrentEntryId(null);
        setIsTracking(false);
        localStorage.removeItem(TIMING_STORAGE_KEY);
      } else {
        // Restore a paused timer exactly as it was persisted.
        setActiveTaskId(parsed.activeTaskId);
        setActiveTaskTitle(parsed.activeTaskTitle);
        setCurrentEntryStartTime(parsed.currentEntryStartTime);
        setCurrentEntryId(parsed.currentEntryId);
        setIsTracking(parsed.isTracking);
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
    if (
      activeTaskId &&
      currentEntryStartTime &&
      currentEntryId !== null &&
      activeTaskTitle !== null
    ) {
      persistTimerState();
    } else {
      localStorage.removeItem(TIMING_STORAGE_KEY);
    }
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryId,
    currentEntryStartTime,
    hasHydratedTimer,
    isTracking,
    persistTimerState,
  ]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isTracking && currentEntryStartTime) {
      intervalId = setInterval(() => {
        // Keep the displayed running duration fresh.
        setTick(Date.now());
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

  const validateAndSync = useCallback(
    (fetchedTasks: Task[]) => {
      setTasks(fetchedTasks);
      if (activeTaskId) {
        const stillExists = fetchedTasks.some((t) => t.id === activeTaskId);
        if (!stillExists) {
          clearActiveTimer();
          localStorage.removeItem(TIMING_STORAGE_KEY);
        }
      }
    },
    [activeTaskId, clearActiveTimer],
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchTasks() {
      try {
        const response = await axios.get<Task[]>("/api/tasks");
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
        const response = await axios.get<Task[]>("/api/tasks");
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
  }) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      status: "todo",
      elapsedSeconds: 0,
      ...draft,
    };
    setTasks((current) => [...current, optimisticTask]);

    try {
      const response = await axios.post<Task>("/api/tasks", {
        ...draft,
        status: "todo",
      });
      setTasks((current) =>
        current.map((task) => (task.id === tempId ? response.data : task)),
      );
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
    setTick(entry.startTime);

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

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: "in_progress",
      });
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

    const totalSeconds = syncTaskElapsedSeconds(taskId);
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

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        elapsedSeconds: Math.floor(totalSeconds),
      });
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
    setTick(entry.startTime);
  };

  const stopTimer = async () => {
    if (!activeTaskId || !activeTaskTitle) return;
    const taskId = activeTaskId;
    const closedEntry = closeCurrentEntry();
    if (!closedEntry) {
      clearActiveTimer();
      return;
    }

    const totalSeconds = syncTaskElapsedSeconds(taskId, closedEntry.duration);
    clearActiveTimer();
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "done",
              elapsedSeconds: Math.floor(totalSeconds),
            }
          : task,
      ),
    );

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: "done",
        elapsedSeconds: totalSeconds,
      });
    } catch (e) {
      if ((e as AxiosError)?.response?.status !== 404) {
        console.error("Failed to stop task:", e);
      }
    }
  };

  const startTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await startTimer(taskId, task.title);
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

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: newStatus,
      });
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
