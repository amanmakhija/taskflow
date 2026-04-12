import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api';
import { CheckCircle2, Circle, Loader2, BarChart3 } from 'lucide-react';

interface StatsPanelProps {
  projectId: string;
  totalTasks: number;
}

export function StatsPanel({ projectId, totalTasks }: StatsPanelProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => projectsApi.stats(projectId),
    retry: false, // Stats endpoint is optional bonus — don't spam if missing
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    // Fallback: show just total if stats endpoint is not available
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <div>
          <p className="text-2xl font-display font-bold">{totalTasks}</p>
          <p className="text-xs text-muted-foreground">Total tasks</p>
        </div>
      </div>
    );
  }

  const { todo = 0, in_progress = 0, done = 0 } = stats.by_status;
  const total = todo + in_progress + done || 1;
  const donePercent = Math.round((done / total) * 100);

  const tiles = [
    { label: 'Todo', value: todo, icon: <Circle className="h-4 w-4" />, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'In Progress', value: in_progress, icon: <Loader2 className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    { label: 'Done', value: done, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`inline-flex p-1.5 rounded-lg ${tile.bg} ${tile.color} mb-2`}>
              {tile.icon}
            </div>
            <p className="text-2xl font-display font-bold">{tile.value}</p>
            <p className="text-xs text-muted-foreground">{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completion</span>
          <span className="text-sm font-display font-bold">{donePercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
            style={{ width: `${donePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
