import { Task } from '../../../types';

export interface CPMTaskMetrics {
  taskId: string;
  duration: number; // in days
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number; // LS - ES
  isCritical: boolean;
}

export interface CPMAnalysisResult {
  criticalTaskIds: Set<string>;
  metrics: Map<string, CPMTaskMetrics>;
  projectDuration: number;
}

/**
 * Calculates the Critical Path Method (CPM) using DAG Forward & Backward Passes.
 * Identifies tasks with Total Float = 0 (or minimal float) whose delays impact the schedule.
 */
export function calculateCPM(tasks: Task[]): CPMAnalysisResult {
  const metrics = new Map<string, CPMTaskMetrics>();
  const criticalTaskIds = new Set<string>();

  if (!tasks || tasks.length === 0) {
    return { criticalTaskIds, metrics, projectDuration: 0 };
  }

  // Build task map and duration calculations
  const taskMap = new Map<string, Task>();
  const predecessorsMap = new Map<string, string[]>();
  const successorsMap = new Map<string, string[]>();

  tasks.forEach((task) => {
    taskMap.set(task.taskId, task);
    predecessorsMap.set(task.taskId, []);
    successorsMap.set(task.taskId, []);
  });

  // Calculate task duration in days (minimum 1 day)
  const getDuration = (task: Task): number => {
    if (task.startDate && task.dueDate) {
      const s = new Date(task.startDate).getTime();
      const e = new Date(task.dueDate).getTime();
      const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
      return Math.max(1, days);
    }
    if (task.estimatedHours && task.estimatedHours > 0) {
      return Math.max(1, Math.ceil(task.estimatedHours / 8));
    }
    if (task.storyPoints && task.storyPoints > 0) {
      return Math.max(1, Math.ceil(task.storyPoints / 2));
    }
    return 2; // default 2 days
  };

  // Wire dependency edges
  tasks.forEach((task) => {
    if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      task.dependencies.forEach((dep) => {
        const predId = typeof dep === 'string' ? dep : dep.taskId;
        if (taskMap.has(predId)) {
          predecessorsMap.get(task.taskId)?.push(predId);
          successorsMap.get(predId)?.push(task.taskId);
        }
      });
    }
  });

  // 1. FORWARD PASS: Compute Early Start (ES) and Early Finish (EF)
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  // Helper for topological-like recursive computation with memoization
  const visiting = new Set<string>();
  const computeEarlyTimes = (taskId: string): void => {
    if (earlyFinish.has(taskId)) return;
    if (visiting.has(taskId)) {
      // Cyclic dependency detected; break cycle gracefully
      earlyStart.set(taskId, 0);
      earlyFinish.set(taskId, getDuration(taskMap.get(taskId)!));
      return;
    }

    visiting.add(taskId);
    const preds = predecessorsMap.get(taskId) || [];
    let maxPredEF = 0;

    for (const predId of preds) {
      computeEarlyTimes(predId);
      const predEF = earlyFinish.get(predId) || 0;
      if (predEF > maxPredEF) {
        maxPredEF = predEF;
      }
    }

    const duration = getDuration(taskMap.get(taskId)!);
    const es = maxPredEF;
    const ef = es + duration;

    earlyStart.set(taskId, es);
    earlyFinish.set(taskId, ef);
    visiting.delete(taskId);
  };

  tasks.forEach((task) => computeEarlyTimes(task.taskId));

  // Determine Project Completion Time
  let projectDuration = 0;
  tasks.forEach((task) => {
    const ef = earlyFinish.get(task.taskId) || 0;
    if (ef > projectDuration) {
      projectDuration = ef;
    }
  });

  // 2. BACKWARD PASS: Compute Late Finish (LF) and Late Start (LS)
  const lateFinish = new Map<string, number>();
  const lateStart = new Map<string, number>();

  const computeLateTimes = (taskId: string): void => {
    if (lateStart.has(taskId)) return;
    if (visiting.has(taskId)) {
      // Cycle break
      const duration = getDuration(taskMap.get(taskId)!);
      lateFinish.set(taskId, projectDuration);
      lateStart.set(taskId, projectDuration - duration);
      return;
    }

    visiting.add(taskId);
    const succs = successorsMap.get(taskId) || [];
    let minSuccLS = projectDuration;

    if (succs.length > 0) {
      minSuccLS = Infinity;
      for (const succId of succs) {
        computeLateTimes(succId);
        const succLS = lateStart.get(succId) ?? projectDuration;
        if (succLS < minSuccLS) {
          minSuccLS = succLS;
        }
      }
    }

    const duration = getDuration(taskMap.get(taskId)!);
    const lf = minSuccLS === Infinity ? projectDuration : minSuccLS;
    const ls = lf - duration;

    lateFinish.set(taskId, lf);
    lateStart.set(taskId, ls);
    visiting.delete(taskId);
  };

  tasks.forEach((task) => computeLateTimes(task.taskId));

  // 3. COMPUTE TOTAL FLOAT & CRITICAL PATH
  let minFloat = Infinity;

  tasks.forEach((task) => {
    const es = earlyStart.get(task.taskId) || 0;
    const ef = earlyFinish.get(task.taskId) || 0;
    const ls = lateStart.get(task.taskId) || 0;
    const lf = lateFinish.get(task.taskId) || 0;
    const totalFloat = Math.max(0, ls - es);

    if (totalFloat < minFloat) {
      minFloat = totalFloat;
    }

    metrics.set(task.taskId, {
      taskId: task.taskId,
      duration: getDuration(task),
      earlyStart: es,
      earlyFinish: ef,
      lateStart: ls,
      lateFinish: lf,
      totalFloat,
      isCritical: false,
    });
  });

  // Identify Critical Path: Tasks with Float <= minFloat + 0.1 (or 0)
  metrics.forEach((metric, taskId) => {
    // If dependencies exist, strict float check. If no dependencies, critical if at end or minimal float
    if (metric.totalFloat <= Math.max(0, minFloat)) {
      metric.isCritical = true;
      criticalTaskIds.add(taskId);
    }
  });

  return {
    criticalTaskIds,
    metrics,
    projectDuration,
  };
}
