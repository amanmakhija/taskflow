import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { tasksApi, usersApi } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/useToast";
import { getInitials } from "@/lib/utils";
import type { Task, User } from "@/types";

interface TaskModalProps {
  projectId: string;
  task?: Task;
  open: boolean;
  onClose: () => void;
}

export function TaskModal({ projectId, task, open, onClose }: TaskModalProps) {
  const qc = useQueryClient();
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    due_date: "",
    assignee_id: "",
  });
  const [titleErr, setTitleErr] = useState("");

  // Fetch users for assignee dropdown
  // Fallback: derive unique assignees from cached project tasks if /users doesn't exist
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      return await usersApi.list();
    },
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        assignee_id: task.assignee_id || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: "",
        assignee_id: "",
      });
    }
    setTitleErr("");
  }, [task, open]);

  const { mutate: createTask, isPending: creating } = useMutation({
    mutationFn: () =>
      tasksApi.create(projectId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || undefined,
        assignee_id: form.assignee_id || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast({ title: "Task created!" });
      onClose();
    },
    onError: (e: any) =>
      toast({
        title: e.response?.data?.error || "Failed to create task",
        variant: "destructive",
      }),
  });

  const { mutate: updateTask, isPending: updating } = useMutation({
    mutationFn: () =>
      tasksApi.update(task!.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || undefined,
        assignee_id: form.assignee_id || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast({ title: "Task updated!" });
      onClose();
    },
    onError: (e: any) =>
      toast({
        title: e.response?.data?.error || "Failed to update task",
        variant: "destructive",
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleErr("Title is required");
      return;
    }
    isEdit ? updateTask() : createTask();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Create task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                setTitleErr("");
              }}
              error={titleErr}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">
              Description{" "}
              <span className="normal-case text-muted-foreground">
                (optional)
              </span>
            </Label>
            <textarea
              id="task-desc"
              placeholder="Add more context…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Task["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as Task["priority"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">
                Due date{" "}
                <span className="normal-case text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Assignee{" "}
                <span className="normal-case text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Select
                value={form.assignee_id || "unassigned"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    assignee_id: v === "unassigned" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-muted-foreground">Unassigned</span>
                  </SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          {getInitials(u.name)}
                        </span>
                        {u.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={creating || updating}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
