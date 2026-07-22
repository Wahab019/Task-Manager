"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios, { AxiosError } from "axios";

export type Priority = "low" | "normal" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
  time: string; // estimated time
  elapsedSeconds: number;
};

interface TimerContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeTaskId: string | null;
  isTracking: boolean;
  currentSeconds: number;
  addTask: (draft: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
  }) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  pauseActiveTask: () => Promise<void>;
  resumeActiveTask: () => void;
  stopActiveTask: () => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    newStatus: Task["status"],
  ) => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  // ─── shared helper: remove a task that no longer exists on the server ────
  const evictTask = useCallback(
    (taskId: string) => {
      setTasks((current) => current.filter((t) => t.id !== taskId));
      if (taskId === activeTaskId) {
        setIsTracking(false);
        setActiveTaskId(null);
        setCurrentSeconds(0);
        localStorage.removeItem("timer_activeTaskId");
        localStorage.removeItem("timer_isTracking");
        localStorage.removeItem("timer_currentSeconds");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTaskId],
  );

  // helper used inside fetch to validate & sync state
  const validateAndSync = useCallback(
    (fetchedTasks: Task[]) => {
      setTasks(fetchedTasks);
      if (activeTaskId) {
        const stillExists = fetchedTasks.some((t) => t.id === activeTaskId);
        if (!stillExists) {
          setIsTracking(false);
          setActiveTaskId(null);
          setCurrentSeconds(0);
          localStorage.removeItem("timer_activeTaskId");
          localStorage.removeItem("timer_isTracking");
          localStorage.removeItem("timer_currentSeconds");
        }
      }
    },
    [activeTaskId],
  );

  // Fetch & validate on mount (also restores localStorage)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    let isMounted = true;
    async function fetchTasks() {
      try {
        const response = await axios.get<Task[]>("/api/tasks");
        if (!isMounted) return;

        const fetchedTasks = response.data;
        setTasks(fetchedTasks);

        // Validate localStorage against the real task list from the server
        const savedActiveTaskId = localStorage.getItem("timer_activeTaskId");
        if (savedActiveTaskId) {
          const taskStillExists = fetchedTasks.some(
            (t) => t.id === savedActiveTaskId,
          );
          if (taskStillExists) {
            const savedCurrentSeconds = Number(
              localStorage.getItem("timer_currentSeconds") || "0",
            );
            setActiveTaskId(savedActiveTaskId);
            // Always start paused on restore
            setIsTracking(false);
            setCurrentSeconds(savedCurrentSeconds);
          } else {
            localStorage.removeItem("timer_activeTaskId");
            localStorage.removeItem("timer_isTracking");
            localStorage.removeItem("timer_currentSeconds");
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch & re-validate whenever the tab regains focus (catches hot-reloads)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await axios.get<Task[]>("/api/tasks");
        validateAndSync(response.data);
      } catch {
        // ignore — background re-fetch is best-effort
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [validateAndSync]);

  // Persist timer state to localStorage when it changes
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem("timer_activeTaskId", activeTaskId);
      localStorage.setItem("timer_isTracking", String(isTracking));
      localStorage.setItem("timer_currentSeconds", String(currentSeconds));
    } else {
      localStorage.removeItem("timer_activeTaskId");
      localStorage.removeItem("timer_isTracking");
      localStorage.removeItem("timer_currentSeconds");
    }
  }, [activeTaskId, isTracking, currentSeconds]);

  // Stopwatch ticking logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isTracking && activeTaskId) {
      intervalId = setInterval(() => {
        setCurrentSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, activeTaskId]);

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

  const pauseTaskById = async (taskId: string, secondsToSave: number) => {
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, elapsedSeconds: secondsToSave } : t,
      ),
    );
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        elapsedSeconds: secondsToSave,
      });
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to save elapsed seconds:", e);
      }
    }
  };

  const startTask = async (taskId: string) => {
    // 1. Pause active task if any
    if (activeTaskId && activeTaskId !== taskId) {
      await pauseTaskById(activeTaskId, currentSeconds);
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let updatedStatus: Task["status"] = task.status;
    let initialSeconds = task.elapsedSeconds;

    if (task.status === "todo") {
      updatedStatus = "in_progress";
      initialSeconds = 0;
    }

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? { ...t, status: updatedStatus, elapsedSeconds: initialSeconds }
          : t,
      ),
    );

    setActiveTaskId(taskId);
    setCurrentSeconds(initialSeconds);
    setIsTracking(true);

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: updatedStatus,
        elapsedSeconds: initialSeconds,
      });
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        evictTask(taskId);
      } else {
        console.error("Failed to update starting task:", e);
      }
    }
  };

  const pauseActiveTask = async () => {
    if (!activeTaskId) return;
    setIsTracking(false);
    await pauseTaskById(activeTaskId, currentSeconds);
  };

  const resumeActiveTask = () => {
    if (!activeTaskId) return;
    setIsTracking(true);
  };

  const stopActiveTask = async () => {
    if (!activeTaskId) return;
    const taskId = activeTaskId;
    const finalSeconds = currentSeconds;

    setIsTracking(false);
    setActiveTaskId(null);
    setCurrentSeconds(0);

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? { ...t, status: "done", elapsedSeconds: finalSeconds }
          : t,
      ),
    );

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: "done",
        elapsedSeconds: finalSeconds,
      });
    } catch (e) {
      if ((e as AxiosError)?.response?.status !== 404) {
        console.error("Failed to stop task:", e);
      }
      // 404 just means the server already lost the task — the client state
      // is already cleaned up above, so nothing more to do.
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"],
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousStatus = task.status;
    if (previousStatus === newStatus) return;

    // Prevent dragging out of done
    if (previousStatus === "done") return;

    // Prevent dragging in-progress tasks back to todo
    if (previousStatus === "in_progress" && newStatus === "todo") return;

    // Optimistic update
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    if (taskId === activeTaskId) {
      if (newStatus === "done") {
        setIsTracking(false);
        setActiveTaskId(null);
        setCurrentSeconds(0);
        try {
          await axios.patch(`/api/tasks/${taskId}`, {
            status: "done",
            elapsedSeconds: currentSeconds,
          });
        } catch (e) {
          console.error(e);
        }
        return;
      } else if (newStatus === "todo") {
        setIsTracking(false);
        try {
          await axios.patch(`/api/tasks/${taskId}`, {
            status: "todo",
            elapsedSeconds: currentSeconds,
          });
        } catch (e) {
          console.error(e);
        }
        return;
      }
    }

    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        status: newStatus,
      });
    } catch (e) {
      if ((e as AxiosError)?.response?.status === 404) {
        // Task gone from server — evict it entirely instead of rolling back
        evictTask(taskId);
      } else {
        // Rollback optimistic update
        setTasks((current) =>
          current.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t,
          ),
        );
        console.error("Failed to update status:", e);
      }
    }
  };

  return (
    <TimerContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        activeTaskId,
        isTracking,
        currentSeconds,
        addTask,
        startTask,
        pauseActiveTask,
        resumeActiveTask,
        stopActiveTask,
        updateTaskStatus,
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
