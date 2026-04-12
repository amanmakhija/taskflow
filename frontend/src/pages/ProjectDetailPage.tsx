import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowLeft,
  Pencil,
  Check,
  X,
  SlidersHorizontal,
  ClipboardList,
} from "lucide-react";
import { projectsApi, tasksApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard, STATUS_LABELS, STATUS_STYLES } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { StatsPanel } from "@/components/StatsPanel";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const COLUMNS: { key: Task["status"]; color: string; dropColor: string }[] = [
  {
    key: "todo",
    color: "bg-slate-400",
    dropColor: "border-slate-400 bg-slate-50 dark:bg-slate-900/40",
  },
  {
    key: "in_progress",
    color: "bg-amber-400",
    dropColor: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
  },
  {
    key: "done",
    color: "bg-emerald-500",
    dropColor: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showStats, setShowStats] = useState(true);

  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Task["status"] | null>(null);

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  const { mutate: updateProject } = useMutation({
    mutationFn: (name: string) => projectsApi.update(id!, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setEditingName(false);
      toast({ title: "Project updated!" });
    },
    onError: () =>
      toast({ title: "Failed to update project", variant: "destructive" }),
  });

  const { mutate: moveTask } = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: Task["status"];
    }) => tasksApi.update(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await qc.cancelQueries({ queryKey: ["project", id] });
      const prev = qc.getQueryData(["project", id]);
      qc.setQueryData(["project", id], (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) =>
            t.id === taskId ? { ...t, status } : t,
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["project", id], ctx.prev);
      toast({ title: "Failed to move task", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["project-stats", id] });
    },
  });

  const handleDragStart = useCallback(
    (task: Task) => setDraggingTask(task),
    [],
  );
  const handleDragEnd = useCallback(() => {
    setDraggingTask(null);
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(
    (targetStatus: Task["status"]) => {
      if (!draggingTask) return;
      if (draggingTask.status !== targetStatus) {
        moveTask({ taskId: draggingTask.id, status: targetStatus });
      }
      setDraggingTask(null);
      setDragOverCol(null);
    },
    [draggingTask, moveTask],
  );

  const startEdit = () => {
    setNewName(project?.name || "");
    setEditingName(true);
  };

  const tasks = project?.tasks ?? [];
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-6 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-3 gap-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="space-y-3 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium mb-3">
            Project not found or failed to load
          </p>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Back nav */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xl font-display font-bold h-auto py-1 px-2 max-w-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateProject(newName);
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
              <button
                onClick={() => updateProject(newName)}
                className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="p-1.5 rounded-md border hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="font-display font-bold text-2xl tracking-tight truncate">
                {project.name}
              </h1>
              <button
                onClick={startEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats((v) => !v)}
            className="hidden sm:flex gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showStats ? "Hide" : "Show"} stats
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(undefined);
              setTaskModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mb-8 animate-fade-in">
          <StatsPanel projectId={id!} totalTasks={tasks.length} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || priorityFilter !== "all") && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Drag hint */}
      {tasks.length > 0 && !draggingTask && (
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <span>💡</span> Drag tasks between columns to change their status
        </p>
      )}

      {/* Kanban board */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-1">
            No tasks yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Add your first task to start tracking work on this project.
          </p>
          <Button
            onClick={() => {
              setEditingTask(undefined);
              setTaskModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add first task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {COLUMNS.map(({ key, color, dropColor }) => {
            const colTasks = tasksByStatus[key];
            const isOver = dragOverCol === key;
            const canDrop =
              draggingTask !== null && draggingTask.status !== key;

            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (draggingTask && draggingTask.status !== key)
                    setDragOverCol(key);
                }}
                onDragLeave={(e) => {
                  // Only clear if leaving the column entirely (not entering a child)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverCol(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(key);
                }}
                className={cn(
                  "rounded-2xl border-2 border-transparent transition-all duration-150 p-3",
                  isOver &&
                    canDrop &&
                    `border-dashed ${dropColor} scale-[1.01]`,
                )}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <h3 className="text-sm font-display font-semibold">
                    {STATUS_LABELS[key]}
                  </h3>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                {/* Drop zone indicator when dragging over empty/other column */}
                {isOver && canDrop && (
                  <div
                    className={cn(
                      "mb-2 rounded-xl border-2 border-dashed py-3 text-center text-xs font-medium transition-all",
                      key === "todo"
                        ? "border-slate-400 text-slate-500"
                        : key === "in_progress"
                          ? "border-amber-400 text-amber-600"
                          : "border-emerald-500 text-emerald-600",
                    )}
                  >
                    Drop to move to {STATUS_LABELS[key]}
                  </div>
                )}

                {/* Task cards */}
                <div className="space-y-2 min-h-[60px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={id!}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setTaskModalOpen(true);
                      }}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggingTask?.id === task.id}
                    />
                  ))}
                  {colTasks.length === 0 && !isOver && (
                    <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      {draggingTask
                        ? `Drop here`
                        : `No ${STATUS_LABELS[key].toLowerCase()} tasks`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal
        projectId={id!}
        task={editingTask}
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(undefined);
        }}
      />
    </div>
  );
}
