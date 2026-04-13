import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { tasksApi } from "@/api";
import { toast } from "@/hooks/useToast";
import { cn, formatDate, isOverdue, getInitials } from "@/lib/utils";
import type { Task } from "@/types";

export const STATUS_STYLES: Record<Task["status"], string> = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
};

export const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_DOT: Record<Task["priority"], string> = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-rose-500",
};

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "text-muted-foreground",
  medium: "text-amber-500",
  high: "text-rose-500",
};

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (task: Task) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function TaskCard({
  task,
  projectId,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const qc = useQueryClient();

  const { mutate: deleteTask } = useMutation({
    mutationFn: () => tasksApi.delete(task.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast({ title: "Task deleted" });
    },
    onError: () =>
      toast({ title: "Failed to delete task", variant: "destructive" }),
  });

  const overdue = isOverdue(task.due_date) && task.status !== "done";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => onDragStart(task), 0);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none",
        isDragging
          ? "opacity-40 scale-[0.98] shadow-none"
          : "hover:border-primary/30 hover:shadow-sm animate-fade-in",
      )}
    >
      {/* Drag handle */}
      <div className="mt-0.5 flex-shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Status + priority badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0",
              STATUS_STYLES[task.status],
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                PRIORITY_DOT[task.priority],
              )}
            />
            {STATUS_LABELS[task.status]}
          </span>
          <span
            className={cn("text-xs font-medium", PRIORITY_COLOR[task.priority])}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {/* Title */}
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            task.status === "done" && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.due_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue
                  ? "text-destructive font-medium"
                  : "text-muted-foreground",
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {formatDate(task.due_date)}
            </span>
          )}

          {/* Assignee avatar + name */}
          {task.assignee_name ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold flex-shrink-0">
                {getInitials(task.assignee_name)}
              </span>
              <span className="truncate max-w-[80px]">
                {task.assignee_name}
              </span>
            </span>
          ) : task.assignee_id ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold flex-shrink-0">
                ?
              </span>
              <span>Assigned</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.confirm("Delete this task?") && deleteTask()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
