import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Calendar, AlertCircle, User } from 'lucide-react';
import { tasksApi } from '@/api';
import { toast } from '@/hooks/useToast';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import type { Task } from '@/types';

const STATUS_STYLES: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_DOT: Record<Task['priority'], string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
};

const NEXT_STATUS: Record<Task['status'], Task['status']> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, projectId, onEdit }: TaskCardProps) {
  const qc = useQueryClient();
  const [optimisticStatus, setOptimisticStatus] = useState<Task['status'] | null>(null);
  const displayStatus = optimisticStatus ?? task.status;

  const { mutate: cycleStatus } = useMutation({
    mutationFn: () => tasksApi.update(task.id, { status: NEXT_STATUS[displayStatus] }),
    onMutate: async () => {
      // Optimistic update
      setOptimisticStatus(NEXT_STATUS[displayStatus]);
      await qc.cancelQueries({ queryKey: ['project', projectId] });
      const prev = qc.getQueryData(['project', projectId]);
      qc.setQueryData(['project', projectId], (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) =>
            t.id === task.id ? { ...t, status: NEXT_STATUS[displayStatus] } : t
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      setOptimisticStatus(null);
      if (ctx?.prev) qc.setQueryData(['project', projectId], ctx.prev);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
    onSettled: () => {
      setOptimisticStatus(null);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const { mutate: deleteTask } = useMutation({
    mutationFn: () => tasksApi.delete(task.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Task deleted' });
    },
    onError: () => toast({ title: 'Failed to delete task', variant: 'destructive' }),
  });

  const overdue = isOverdue(task.due_date) && displayStatus !== 'done';

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 animate-fade-in">
      {/* Status button (click to cycle) */}
      <button
        onClick={() => cycleStatus()}
        title={`Current: ${STATUS_LABELS[displayStatus]} — click to advance`}
        className={cn(
          'mt-0.5 flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary/40 cursor-pointer',
          STATUS_STYLES[displayStatus]
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
        {STATUS_LABELS[displayStatus]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium leading-snug', displayStatus === 'done' && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {task.due_date && (
            <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {formatDate(task.due_date)}
            </span>
          )}
          {task.assignee_id && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              Assigned
            </span>
          )}
          <span className={cn(
            'text-xs capitalize font-medium',
            task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
          )}>
            {task.priority}
          </span>
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
          onClick={() => window.confirm('Delete this task?') && deleteTask()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
