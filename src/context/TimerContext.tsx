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

import { formatSeconds } from "@/lib/utils";
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
  version?: number;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  currentEntryStartTime: number | null;
  currentEntryId: string | null;
  isTracking: boolean;
  currentSeconds: number;
  persistedAt: number;
};

type TimeLogResponse = {
  id: string;
  taskId: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
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
  updateTask: (
    taskId: string,
    updates: {
      title: string;
      description: string;
      priority: Priority;
      estimatedMinutes: number | null;
      deadline: string | null;
    },
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reloadData: () => Promise<void>;
  getTotalDurationForTask: (taskId: string) => number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMING_STORAGE_KEY = "timer_state";
const TIMELOGS_STORAGE_KEY = "timer_timelogs";
const TIMER_STATE_VERSION = 2;

function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createClosedEntry(taskId: string, startTime: number, endTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime,
    duration: Math.floor(Math.max(0, (endTime - startTime) / 1000)),
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

function computeLiveSeconds(
  baseSeconds: number,
  startTime: number | null,
  now = Date.now(),
) {
  if (!startTime) return baseSeconds;
  return baseSeconds + Math.floor(Math.max(0, (now - startTime) / 1000));
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

  const currentSecondsRef = React.useRef(0);
  useEffect(() => {
    currentSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  const currentEntryStartTimeRef = React.useRef<number | null>(null);
  useEffect(() => {
    currentEntryStartTimeRef.current = currentEntryStartTime;
  }, [currentEntryStartTime]);

  const timelogsRef = React.useRef(timelogs);
  useEffect(() => {
    timelogsRef.current = timelogs;
  }, [timelogs]);

  const getTotalDurationForTask = useCallback(
    (taskId: string) =>
      timelogsRef.current
        .filter((log) => log.taskId === taskId && log.endTime !== null)
        .reduce((sum, log) => sum + log.duration, 0),
    [],
  );

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
    // Save the base seconds (closed entries only), NOT including the running segment.
    // The hydration logic adds the running segment duration on top.
    const baseSeconds = activeTaskId
      ? getTotalDurationForTask(activeTaskId)
      : 0;

    const payload: PersistedTimerState = {
      version: TIMER_STATE_VERSION,
      activeTaskId,
      activeTaskTitle,
      currentEntryStartTime,
      currentEntryId,
      isTracking,
      currentSeconds: baseSeconds,
      persistedAt: Date.now(),
    };
    localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(payload));
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryStartTime,
    currentEntryId,
    getTotalDurationForTask,
    isTracking,
  ]);

  const persistTimelogs = useCallback(() => {
    if (hasHydratedLogs) {
      localStorage.setItem(
        TIMELOGS_STORAGE_KEY,
        JSON.stringify(timelogsRef.current),
      );
    }
  }, [hasHydratedLogs]);

  const readCachedLogs = useCallback(() => {
    const saved = localStorage.getItem(TIMELOGS_STORAGE_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved) as TimeLogEntry[];
    } catch (e) {
      console.error("Failed to parse saved time logs:", e);
      return [];
    }
  }, []);

  const loadTimelogs = useCallback(async () => {
    try {
      const response = await axios.get<TimeLogResponse[]>("/api/timelogs", {
        headers: await getAuthHeader(),
      });
      setTimelogs(
        response.data.map((entry) => ({
          id: entry.id,
          taskId: entry.taskId,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
        })),
      );
      setError(null);
    } catch (error) {
      console.error("Failed to load timelogs:", error);
      setTimelogs(readCachedLogs());
      setError("Couldn't load time logs. Try again.");
    } finally {
      setHasHydratedLogs(true);
    }
  }, [readCachedLogs]);

  const syncEntryToServer = useCallback(async (entry: TimeLogEntry) => {
    try {
      await axios.post(
        "/api/timelogs",
        {
          taskId: entry.taskId,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
        },
        { headers: await getAuthHeader() },
      );
    } catch (error) {
      console.error("Failed to sync timelog:", error);
      setError("Couldn't sync time log. Try again.");
    }
  }, []);

  const persistPausedTimerSnapshot = useCallback(() => {
    if (!activeTaskId || !activeTaskTitle) {
      localStorage.removeItem(TIMING_STORAGE_KEY);
      return;
    }

    const now = Date.now();
    let closedEntry: TimeLogEntry | null = null;

    // Close the open entry so it's not orphaned.
    // This ensures getTotalDurationForTask includes it on next load.
    if (currentEntryStartTime && currentEntryId) {
      closedEntry = {
        id: currentEntryId,
        taskId: activeTaskId,
        startTime: currentEntryStartTime,
        endTime: now,
        duration: Math.floor(Math.max(0, (now - currentEntryStartTime) / 1000)),
      };

      // Update in-memory timelogs so persistTimelogs won't overwrite with the stale open entry.
      setTimelogs((current) => {
        const filtered = current.filter((log) => log.id !== currentEntryId);
        return [...filtered, closedEntry!];
      });
      void syncEntryToServer(closedEntry);

      const savedLogs = localStorage.getItem(TIMELOGS_STORAGE_KEY);
      if (savedLogs) {
        try {
          const logs = JSON.parse(savedLogs) as TimeLogEntry[];
          const filtered = logs.filter((log) => log.id !== currentEntryId);
          localStorage.setItem(
            TIMELOGS_STORAGE_KEY,
            JSON.stringify([...filtered, closedEntry]),
          );
        } catch {
          // ignore parse errors
        }
      }
    }

    // Compute the exact elapsed seconds from timestamps, not the last interval tick.
    // This ensures the timer is accurate even if the page is closed mid-second.
    const baseSeconds = getTotalDurationForTask(activeTaskId);
    const liveSeconds = computeLiveSeconds(
      baseSeconds,
      currentEntryStartTime,
      now,
    );

    const payload: PersistedTimerState = {
      version: TIMER_STATE_VERSION,
      activeTaskId,
      activeTaskTitle,
      currentEntryStartTime: null,
      currentEntryId: null,
      isTracking: false,
      currentSeconds: liveSeconds,
      persistedAt: now,
    };

    localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(payload));
  }, [
    activeTaskId,
    activeTaskTitle,
    currentEntryStartTime,
    currentEntryId,
    getTotalDurationForTask,
    syncEntryToServer,
  ]);

  useEffect(() => {
    persistTimelogs();
  }, [persistTimelogs]);

  useEffect(() => {
    const handlePageExit = (
      event?: PageTransitionEvent | BeforeUnloadEvent,
    ) => {
      if (!hasHydratedTimer) return;
      persistPausedTimerSnapshot();

      if (isTracking && event?.type === "beforeunload") {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);

    return () => {
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
    };
  }, [hasHydratedTimer, isTracking, persistPausedTimerSnapshot]);

  useEffect(() => {
    const defaultTitle = "Task Manager";

    if (isTracking && activeTaskTitle) {
      document.title = `${formatSeconds(currentSeconds)} – ${activeTaskTitle}`;
      return () => {
        document.title = defaultTitle;
      };
    }

    document.title = defaultTitle;
    return () => {
      document.title = defaultTitle;
    };
  }, [activeTaskTitle, currentSeconds, isTracking]);

  const syncTaskElapsedSeconds = useCallback(
    (taskId: string, extraDuration = 0) => {
      const totalSeconds =
        timelogsRef.current
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
    [],
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
        duration: Math.floor(
          Math.max(0, (endTime - currentEntryStartTime) / 1000),
        ),
      } satisfies TimeLogEntry;

      setTimelogs((current) => {
        const filtered = current.filter((log) => log.id !== currentEntryId);
        return [...filtered, closedEntry];
      });
      void syncEntryToServer(closedEntry);

      setCurrentEntryStartTime(null);
      setCurrentEntryId(null);
      setIsTracking(false);
      return closedEntry;
    },
    [activeTaskId, currentEntryId, currentEntryStartTime, syncEntryToServer],
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
      if (parsed.activeTaskId) {
        let totalSeconds = 0;
        if (parsed.currentEntryStartTime && parsed.currentEntryId) {
          const endTime = parsed.persistedAt || Date.now();
          const closedEntry = createClosedEntry(
            parsed.activeTaskId,
            parsed.currentEntryStartTime,
            endTime,
          );
          closedEntry.id = parsed.currentEntryId;

          setTimelogs((current) => {
            const filtered = current.filter((log) => log.id !== closedEntry.id);
            return [...filtered, closedEntry];
          });
          void syncEntryToServer(closedEntry);

          const baseSeconds = parsed.currentSeconds ?? 0;
          // v2: currentSeconds is base (closed entries only), so add the segment duration.
          // Legacy (no version): currentSeconds already included the running segment,
          // so adding the segment again would double-count.
          totalSeconds =
            parsed.version === TIMER_STATE_VERSION
              ? baseSeconds + closedEntry.duration
              : Math.max(baseSeconds, closedEntry.duration);
        } else {
          totalSeconds = parsed.currentSeconds ?? 0;
        }

        // Closing or reopening tab restores the task in a paused state with exact duration.
        setActiveTaskId(parsed.activeTaskId);
        setActiveTaskTitle(parsed.activeTaskTitle);
        setCurrentEntryStartTime(null);
        setCurrentEntryId(null);
        setIsTracking(false);
        setCurrentSeconds(totalSeconds);

        setTasks((current) =>
          current.map((t) =>
            t.id === parsed.activeTaskId
              ? { ...t, status: "in_progress", elapsedSeconds: totalSeconds }
              : t,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to parse saved timer state:", e);
      localStorage.removeItem(TIMING_STORAGE_KEY);
    } finally {
      // Allow normal persistence after the initial restore pass.
      setHasHydratedTimer(true);
    }
  }, [syncEntryToServer]);

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
    if (isTracking && currentEntryStartTime && activeTaskId) {
      const updateClock = () => {
        const closedSeconds = getTotalDurationForTask(activeTaskId);
        const segmentSeconds = Math.floor(
          Math.max(0, (Date.now() - currentEntryStartTime) / 1000),
        );
        const total = closedSeconds + segmentSeconds;
        setCurrentSeconds(total);
        setTasks((current) =>
          current.map((t) =>
            t.id === activeTaskId ? { ...t, elapsedSeconds: total } : t,
          ),
        );
      };

      updateClock();
      intervalId = setInterval(updateClock, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isTracking,
    currentEntryStartTime,
    activeTaskId,
    getTotalDurationForTask,
  ]);

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
      const savedTimerRaw = localStorage.getItem(TIMING_STORAGE_KEY);
      let savedActiveId: string | null = null;
      if (savedTimerRaw) {
        try {
          const parsed = JSON.parse(savedTimerRaw) as PersistedTimerState;
          savedActiveId = parsed.activeTaskId;
        } catch {
          // ignore
        }
      }

      setTasks((current) => {
        const currentById = new Map(current.map((task) => [task.id, task]));
        return fetchedTasks.map((task) => {
          const existing = currentById.get(task.id);
          const localClosedSeconds = Math.floor(
            getTotalDurationForTask(task.id),
          );

          const isPersistedActive =
            savedActiveId === task.id || activeTaskIdRef.current === task.id;

          // For the active task, compute the live seconds from timestamps.
          // This prevents the timer from rolling backward when the server
          // returns a stale elapsedSeconds value.
          let liveSeconds = localClosedSeconds;
          if (isPersistedActive) {
            liveSeconds = computeLiveSeconds(
              localClosedSeconds,
              currentEntryStartTimeRef.current,
            );
          }

          const effectiveSeconds = Math.round(
            Math.max(
              task.elapsedSeconds || 0,
              existing?.elapsedSeconds || 0,
              liveSeconds,
            ),
          );

          const effectiveStatus = isPersistedActive
            ? "in_progress"
            : (existing?.status ?? task.status);

          return {
            ...task,
            status: effectiveStatus,
            elapsedSeconds: effectiveSeconds,
          };
        });
      });
      const currentActive = activeTaskIdRef.current || savedActiveId;
      if (currentActive && !isTemporaryTaskId(currentActive)) {
        const stillExists = fetchedTasks.some((t) => t.id === currentActive);
        if (!stillExists) {
          clearActiveTimer();
          localStorage.removeItem(TIMING_STORAGE_KEY);
        }
      }
    },
    [clearActiveTimer, getTotalDurationForTask],
  );

  const validateAndSyncRef = React.useRef(validateAndSync);
  useEffect(() => {
    validateAndSyncRef.current = validateAndSync;
  }, [validateAndSync]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get<Task[]>("/api/tasks", {
        headers: await getAuthHeader(),
      });
      setError(null);
      validateAndSyncRef.current(response.data);
    } catch {
      setError("Couldn't load tasks. Try refreshing.");
    }
  }, []);

  const reloadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTasks(), loadTimelogs()]);
    setIsLoading(false);
  }, [fetchTasks, loadTimelogs]);

  useEffect(() => {
    let isMounted = true;
    async function initialLoad() {
      try {
        await fetchTasks();
        if (!isMounted) return;
        await loadTimelogs();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    initialLoad();
    return () => {
      isMounted = false;
    };
  }, [fetchTasks, loadTimelogs]);

  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(() => setError(null), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await axios.get<Task[]>("/api/tasks", {
          headers: await getAuthHeader(),
        });
        validateAndSyncRef.current(response.data);
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
    if (activeTaskId && activeTaskId !== taskId && isTracking) {
      await pauseTimer();
    }

    const entry = createOpenEntry(taskId, Date.now());
    const baseSeconds = Math.round(getTotalDurationForTask(taskId));

    setActiveTaskId(taskId);
    setActiveTaskTitle(taskTitle);
    setCurrentEntryStartTime(entry.startTime);
    setCurrentEntryId(entry.id);
    setIsTracking(true);
    setCurrentSeconds(baseSeconds);
    promoteTaskToInProgress(taskId);

    if (isTemporaryTaskId(taskId)) {
      return;
    }

    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status: "in_progress", elapsedSeconds: baseSeconds },
        { headers: await getAuthHeader() },
      );
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to start timer:", e);
        setError("Couldn't start timer. Try again.");
      }
    }
  };

  const pauseTimer = async () => {
    if (!activeTaskId || !activeTaskTitle) return;
    const taskId = activeTaskId;
    const closedEntry = closeCurrentEntry();

    const totalSeconds = Math.round(
      closedEntry
        ? syncTaskElapsedSeconds(taskId, closedEntry.duration)
        : Math.floor(getTotalDurationForTask(taskId)),
    );

    setCurrentSeconds(totalSeconds);
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "in_progress",
              elapsedSeconds: totalSeconds,
            }
          : task,
      ),
    );

    setCurrentEntryStartTime(null);
    setCurrentEntryId(null);
    setIsTracking(false);

    if (isTemporaryTaskId(taskId)) {
      return;
    }

    try {
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status: "in_progress", elapsedSeconds: totalSeconds },
        { headers: await getAuthHeader() },
      );
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to pause timer:", e);
        setError("Couldn't pause timer. Try again.");
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
          setError("Couldn't stop timer. Try again.");
        }
      }
    }
  };

  const startTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
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
        setError("Couldn't update task status. Try again.");
      }
    }
  };

  const updateTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      priority: Priority;
      estimatedMinutes: number | null;
      deadline: string | null;
    },
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || isTemporaryTaskId(taskId)) return;

    const previousTask = task;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    );

    try {
      const response = await axios.patch<Task>(
        `/api/tasks/${taskId}`,
        updates,
        { headers: await getAuthHeader() },
      );
      setTasks((current) =>
        current.map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...response.data,
                elapsedSeconds: t.elapsedSeconds,
                status: t.status,
              }
            : t,
        ),
      );
      if (activeTaskId === taskId) {
        setActiveTaskTitle(response.data.title);
      }
    } catch (e) {
      setTasks((current) =>
        current.map((t) => (t.id === taskId ? previousTask : t)),
      );
      if ((e as AxiosError<{ error?: string }>)?.response?.status === 404) {
        evictTask(taskId);
      }
      setError("Couldn't update the task. Try again.");
      throw new Error(
        (e as AxiosError<{ error?: string }>)?.response?.data?.error ??
          "Couldn't update the task. Try again.",
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || isTemporaryTaskId(taskId)) return;

    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: await getAuthHeader(),
      });
      evictTask(taskId);
    } catch (e) {
      if ((e as AxiosError<{ error?: string }>)?.response?.status === 404) {
        evictTask(taskId);
      }
      setError("Couldn't delete the task. Try again.");
      throw new Error(
        (e as AxiosError<{ error?: string }>)?.response?.data?.error ??
          "Couldn't delete the task. Try again.",
      );
    }
  };

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
        updateTask,
        deleteTask,
        reloadData,
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
