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

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMING_STORAGE_KEY = "timer_state";
const TIMELOGS_STORAGE_KEY = "timer_timelogs";
const TIMER_STATE_VERSION = 2;

// Creates a stable-enough client-side ID for optimistic time log entries before the server stores them.
function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Builds a completed time log entry and calculates its duration from the start and end timestamps.
function createClosedEntry(taskId: string, startTime: number, endTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime,
    duration: Math.floor(Math.max(0, (endTime - startTime) / 1000)),
  };
}

// Builds a running time log entry with no end time so the timer can be resumed or closed later.
function createOpenEntry(taskId: string, startTime: number) {
  return {
    id: createEntryId(),
    taskId,
    startTime,
    endTime: null,
    duration: 0,
  };
}

// Detects optimistic tasks that exist only in local state and should not be patched on the server yet.
function isTemporaryTaskId(taskId: string) {
  return taskId.startsWith("temp-");
}

// Adds the currently running segment to closed-log seconds so displayed elapsed time stays current.
function computeLiveSeconds(
  baseSeconds: number,
  startTime: number | null,
  now = Date.now(),
) {
  if (!startTime) return baseSeconds;
  return baseSeconds + Math.floor(Math.max(0, (now - startTime) / 1000));
}

// Owns task, timer, persistence, and sync state for the whole app through React context.
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

  // Totals all closed time log durations for one task from the latest timelog ref.
  const getTotalDurationForTask = useCallback(
    (taskId: string) =>
      timelogsRef.current
        .filter((log) => log.taskId === taskId && log.endTime !== null)
        .reduce((sum, log) => sum + log.duration, 0),
    [],
  );

  // Moves a task into the in-progress column locally when timing starts or resumes.
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

  // Writes the active timer snapshot to localStorage so refreshes can restore the session accurately.
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

  // Reads cached time logs from localStorage as an offline fallback when the API request fails.
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

  // Loads server time logs and merges unsynced local entries without double-counting known server entries.
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
      // Merge: server is source of truth for entries it already knows about,
      // but any locally-held entry whose id is NOT yet in the server response
      // (i.e. a just-closed segment whose POST hasn't finished yet) is kept
      // so it isn't silently discarded by a racing GET.
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

  // Posts a completed local time log to the API while preserving the client-generated ID for dedupe.
  const syncEntryToServer = useCallback(async (entry: TimeLogEntry) => {
    try {
      await axios.post(
        "/api/timelogs",
        {
          // Send the client-generated ID so the server stores the document
          // under the same ID.  This makes client ID == server ID, which lets
          // loadTimelogs deduplicate correctly and prevents the double-count
          // that caused the timer to jump forward on Resume after a refresh.
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

  // Recomputes and stores the elapsed seconds for a task after a timer segment closes.
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

  // Closes the active running entry, saves it locally, queues server sync, and pauses tracking state.
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

  // Clears active task metadata after a timer is stopped or invalidated.
  const clearActiveTimer = useCallback(() => {
    setActiveTaskId(null);
    setActiveTaskTitle(null);
    setCurrentEntryStartTime(null);
    currentEntryStartTimeRef.current = null;
    setCurrentEntryId(null);
    setIsTracking(false);
  }, []);

  // At the moment the page is hidden (tab closed, refreshed, or navigated
  // away), stamp persistedAt with the exact current timestamp.  This ensures
  // the hydration effect on the next load computes an accurate segment
  // duration instead of relying on the last timer-tick value, which can be
  // up to 1 second behind the actual close time.
  useEffect(() => {
    // Refreshes the persisted timestamp right before the browser hides the page.
    // That gives the next hydration pass an exact stop point for the running segment.
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

          // Compute the updated list eagerly and write it to both state and
          // the ref immediately.  The direct ref update means
          // getTotalDurationForTask sees the correct total synchronously —
          // before the next React render and before loadTimelogs can arrive
          // with a server response that might not yet contain this entry.
          const hydratedPrior = timelogsRef.current.filter(
            (log) => log.id !== closedEntry.id,
          );
          const hydratedLogs = [...hydratedPrior, closedEntry];
          setTimelogs(hydratedLogs);
          timelogsRef.current = hydratedLogs;
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
      // Recomputes the live timer display from closed logs plus the open segment.
      // It also mirrors the same value onto the active task so every UI surface stays aligned.
      const updateClock = () => {
        const closedSeconds = getTotalDurationForTask(activeTaskId);
        const segmentSeconds = Math.floor(
          Math.max(0, (Date.now() - currentEntryStartTime) / 1000),
        );
        const computed = closedSeconds + segmentSeconds;
        // Never tick the displayed counter backward.  In cross-device
        // scenarios the local timelogs sum may temporarily undercount until
        // it catches up to server state; clamping to the last displayed value
        // keeps the counter monotonically increasing until they converge.
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

  // Removes a task from local state and clears timer state if that task was currently active.
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

  // Merges freshly fetched tasks with local timer state so server data cannot rewind active elapsed time.
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

  // Fetches tasks from the API and runs the local/server reconciliation pass.
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

  // Reloads both task and timelog data while exposing a loading state to consumers.
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTasks(), loadTimelogs()]);
    setIsLoading(false);
  }, [fetchTasks, loadTimelogs]);

  useEffect(() => {
    let isMounted = true;
    // Performs the first task and timelog fetch after the provider mounts.
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
    // Revalidates tasks when the tab becomes visible again.
    // This picks up changes made elsewhere without interrupting the current local timer.
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

  // Creates a task optimistically so the board updates immediately, then swaps in the server copy.
  // If the API request fails, the temporary task is removed and the provider exposes an error message.
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

  // Starts a new running time entry for a task and pauses any other actively running timer first.
  const startTimer = async (taskId: string, taskTitle: string) => {
    if (activeTaskId && activeTaskId !== taskId && isTracking) {
      await pauseTimer();
    }

    const entry = createOpenEntry(taskId, Date.now());
    const localTotal = Math.round(getTotalDurationForTask(taskId));
    // Use the larger of: local timelogs sum vs the server-backed
    // elapsedSeconds already in state (set by validateAndSync to the
    // max of server and local).  This prevents a backward jump when
    // starting from a fresh device where local timelogs may be missing
    // a session that ran — and was saved to the server — on another device.
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

  // Closes the active time entry while keeping the task in progress for later resume.
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

  // Starts a fresh running entry for the paused active task without resetting its accumulated duration.
  const resumeTimer = async () => {
    if (!activeTaskId || !activeTaskTitle || currentEntryStartTime) return;
    const taskId = activeTaskId;
    const entry = createOpenEntry(taskId, Date.now());
    // Same floor logic as startTimer: take the larger of local timelogs sum
    // vs the server-backed elapsedSeconds so that resuming never jumps
    // backward, whether on the same device or a different one.
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

  // Completes the target task, closes any active entry, and persists the final elapsed seconds.
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

  // Convenience wrapper that finds a task title before starting its timer.
  const startTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await startTimer(taskId, task.title);
  };

  // Convenience wrapper that stops a task by ID through the shared stopTimer flow.
  const stopTask = async (taskId: string) => {
    await stopTimer(taskId);
  };

  const pauseActiveTask = pauseTimer;
  const resumeActiveTask = resumeTimer;
  const stopActiveTask = stopTimer;

  // Applies guarded task status transitions and persists valid changes to the server.
  // Timer-driven transitions are routed through pause/stop so elapsed time is closed correctly.
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

  // Updates task details with an optimistic local change while preserving timer-derived fields.
  // If persistence fails, the previous task snapshot is restored before the error is rethrown.
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

  // Deletes a persisted task through the API and removes it from local state.
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

// Returns the timer context and fails loudly when called outside TimerProvider.
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
