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

/** Context carrying task, time-log, timer, and persistence operations. */
const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMING_STORAGE_KEY = "timer_state";
const TIMELOGS_STORAGE_KEY = "timer_timelogs";
const TIMER_STATE_VERSION = 2;

/** Creates a client-side ID for an optimistic time-log entry. */
function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Builds a closed time-log entry with a non-negative elapsed duration. */
function createClosedEntry(taskId: string, startTime: number, endTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime,
    duration: Math.floor(Math.max(0, (endTime - startTime) / 1000)),
  };
}

/** Builds an open time-log entry for a currently running timer segment. */
function createOpenEntry(taskId: string, startTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime: null,
    duration: 0,
  };
}

/** Returns whether a task exists locally but has not been persisted yet. */
function isTemporaryTaskId(taskId: string) {
  return taskId.startsWith("temp-");
}

/** Adds the currently running segment to closed-log seconds for display. */
function computeLiveSeconds(
  baseSeconds: number,
  startTime: number | null,
  now = Date.now(),
) {
  if (!startTime) return baseSeconds;
  return baseSeconds + Math.floor(Math.max(0, (now - startTime) / 1000));
}

/**
 * Owns task, timer, persistence, and synchronization state for the application.
 *
 * Local timer state is updated immediately for responsive controls, then
 * reconciled with the task and time-log APIs as network operations complete.
 */
export function TimerProvider({ children }: { children: React.ReactNode }) {
  /** Task collection and loading/error state for task API operations. */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Active timer identity, running segment metadata, and displayed duration. */
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);
  const [currentEntryStartTime, setCurrentEntryStartTime] = useState<
    number | null
  >(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  /** Time logs plus hydration flags used to coordinate startup persistence. */
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

  /** Totals closed time-log durations for one task from the latest ref state. */
  const getTotalDurationForTask = useCallback(
    (taskId: string) =>
      timelogsRef.current
        .filter((log) => log.taskId === taskId && log.endTime !== null)
        .reduce((sum, log) => sum + log.duration, 0),
    [],
  );

  /** Promotes a task to the in-progress column in local state. */
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

  /**
   * Persists the active timer snapshot for accurate refresh recovery.
   *
   * Only closed-log seconds are stored in `currentSeconds`; hydration adds the
   * open segment from its timestamps to avoid double-counting it.
   */
  const persistTimerState = useCallback(() => {
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

  /** Reads cached time logs as an offline fallback when the API fails. */
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

  /**
   * Loads server time logs and preserves unsynced local entries.
   *
   * Server entries replace matching local IDs, while local-only entries remain
   * visible until their background POST is observed by a later request.
   */
  const loadTimelogs = useCallback(async () => {
    try {
      const response = await axios.get<TimeLogResponse[]>("/api/timelogs", {
        headers: await getAuthHeader(),
      });
      const serverEntries: TimeLogEntry[] = response.data.map((entry) => ({
        id: entry.id,
        taskId: entry.taskId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
      }));
      const serverIds = new Set(serverEntries.map((e) => e.id));
      const localOnlyEntries = timelogsRef.current.filter(
        (local) => !serverIds.has(local.id),
      );
      setTimelogs([...serverEntries, ...localOnlyEntries]);
      setError(null);
    } catch (error) {
      console.error("Failed to load timelogs:", error);
      setTimelogs(readCachedLogs());
      setError("Couldn't load time logs. Try again.");
    } finally {
      setHasHydratedLogs(true);
    }
  }, [readCachedLogs]);

  /** Posts a completed time log while preserving its client-generated ID. */
  const syncEntryToServer = useCallback(async (entry: TimeLogEntry) => {
    try {
      await axios.post(
        "/api/timelogs",
        {
          clientId: entry.id,
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

  /** Recomputes a task's closed duration after a timer segment closes. */
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

  /**
   * Closes the active running entry and queues it for server synchronization.
   * Returns `null` when no complete active-entry state is available.
   */
  const closeCurrentEntry = useCallback(
    (endTime = Date.now()) => {
      if (
        !activeTaskId ||
        !currentEntryStartTime ||
        !currentEntryId ||
        !currentEntryStartTimeRef.current
      ) {
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

      currentEntryStartTimeRef.current = null;

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

  /** Clears active task metadata after stopping or invalidating a timer. */
  const clearActiveTimer = useCallback(() => {
    setActiveTaskId(null);
    setActiveTaskTitle(null);
    setCurrentEntryStartTime(null);
    currentEntryStartTimeRef.current = null;
    setCurrentEntryId(null);
    setIsTracking(false);
  }, []);

  /**
   * Refreshes the persisted timestamp when the page is hidden.
   * This gives the next hydration pass an accurate endpoint for a running
   * segment instead of relying on the last one-second timer tick.
   */
  useEffect(() => {
    /** Stamps the saved running timer with the exact page-hide timestamp. */
    const handlePageHide = () => {
      const saved = localStorage.getItem(TIMING_STORAGE_KEY);
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as PersistedTimerState;
        if (parsed.isTracking && parsed.currentEntryStartTime) {
          const updated: PersistedTimerState = {
            ...parsed,
            persistedAt: Date.now(),
          };
          localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  /** Restores a persisted timer snapshot and any elapsed open segment. */
  useEffect(() => {
    const saved = localStorage.getItem(TIMING_STORAGE_KEY);
    if (!saved) {
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

          const hydratedPrior = timelogsRef.current.filter(
            (log) => log.id !== closedEntry.id,
          );
          const hydratedLogs = [...hydratedPrior, closedEntry];
          setTimelogs(hydratedLogs);
          timelogsRef.current = hydratedLogs;
          void syncEntryToServer(closedEntry);

          const baseSeconds = parsed.currentSeconds ?? 0;
          totalSeconds =
            parsed.version === TIMER_STATE_VERSION
              ? baseSeconds + closedEntry.duration
              : Math.max(baseSeconds, closedEntry.duration);
        } else {
          totalSeconds = parsed.currentSeconds ?? 0;
        }

        // Restored timers are paused so the user explicitly resumes the session.
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

  /** Persists or removes timer state whenever the active timer snapshot changes. */
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

  /**
   * Keeps the displayed active-task duration current once per second.
   * The computed value is clamped to the previous display so stale log data
   * cannot make the timer visibly move backward during synchronization.
   */
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isTracking && currentEntryStartTime && activeTaskId) {
      /** Recomputes live seconds and mirrors them onto the active task. */
      const updateClock = () => {
        const closedSeconds = getTotalDurationForTask(activeTaskId);
        const segmentSeconds = Math.floor(
          Math.max(0, (Date.now() - currentEntryStartTime) / 1000),
        );
        const computed = closedSeconds + segmentSeconds;
        const total = Math.max(computed, currentSecondsRef.current);
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

  /** Removes a task locally and clears its active timer state when necessary. */
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

  /**
   * Merges fetched tasks with local timer state without rewinding elapsed time.
   * Active tasks retain local live duration and in-progress status when needed.
   */
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

  /** Fetches tasks from the API and applies local/server reconciliation. */
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

  /** Reloads task and timelog data while exposing a loading state. */
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTasks(), loadTimelogs()]);
    setIsLoading(false);
  }, [fetchTasks, loadTimelogs]);

  useEffect(() => {
    let isMounted = true;
    /** Performs the initial task and time-log fetch after mounting. */
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

  /** Clears transient API errors after they have been visible briefly. */
  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(() => setError(null), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  /** Refreshes tasks when the browser tab becomes visible again. */
  useEffect(() => {
    /** Fetches current tasks without interrupting the local timer. */
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

  /**
   * Creates a task optimistically, then replaces it with the server response.
   * Failed requests remove the temporary task and expose an error message.
   */
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
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedMinutes: task.estimatedMinutes,
            deadline: task.deadline,
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

  /**
   * Starts a new running time entry for a task.
   * Pauses another active timer first so only one task tracks time at once.
   */
  const startTimer = async (taskId: string, taskTitle: string) => {
    if (activeTaskId && activeTaskId !== taskId && isTracking) {
      await pauseTimer();
    }

    const entry = createOpenEntry(taskId, Date.now());
    const localTotal = Math.round(getTotalDurationForTask(taskId));
    const taskInState = tasks.find((t) => t.id === taskId);
    const baseSeconds = Math.max(localTotal, taskInState?.elapsedSeconds ?? 0);

    setActiveTaskId(taskId);
    setActiveTaskTitle(taskTitle);
    setCurrentEntryStartTime(entry.startTime);
    currentEntryStartTimeRef.current = entry.startTime;
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

  /** Closes the active segment while keeping the task available for resume. */
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

  /** Starts a fresh segment for the paused task without resetting its duration. */
  const resumeTimer = async () => {
    if (!activeTaskId || !activeTaskTitle || currentEntryStartTime) return;
    const taskId = activeTaskId;
    const entry = createOpenEntry(taskId, Date.now());
    const localTotal = Math.floor(getTotalDurationForTask(taskId));
    const taskInState = tasks.find((t) => t.id === taskId);
    const resumeFrom = Math.max(localTotal, taskInState?.elapsedSeconds ?? 0);
    setCurrentEntryStartTime(entry.startTime);
    currentEntryStartTimeRef.current = entry.startTime;
    setCurrentEntryId(entry.id);
    setIsTracking(true);
    setCurrentSeconds(resumeFrom);
    promoteTaskToInProgress(taskId);
  };

  /**
   * Completes a task, closes its active segment when applicable, and persists
   * the final elapsed duration. It also supports stopping an inactive task.
   */
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

  /** Starts a task after resolving its title from the local task collection. */
  const startTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await startTimer(taskId, task.title);
  };

  /** Stops a task by ID through the shared stopTimer flow. */
  const stopTask = async (taskId: string) => {
    await stopTimer(taskId);
  };

  const pauseActiveTask = pauseTimer;
  const resumeActiveTask = resumeTimer;
  const stopActiveTask = stopTimer;

  /**
   * Applies guarded task status transitions and persists valid changes.
   * Timer-driven transitions route through pause/stop so elapsed time closes
   * correctly before the status is changed.
   */
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

  /**
   * Updates task details optimistically while preserving timer-derived fields.
   * Failed persistence restores the previous snapshot and rethrows the error.
   */
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
    if (!task) return;

    const previousTask = task;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    );

    if (isTemporaryTaskId(taskId)) {
      return;
    }

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

  /** Deletes a persisted task through the API and removes it locally. */
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

/** Returns timer state and actions, failing when used outside TimerProvider. */
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
