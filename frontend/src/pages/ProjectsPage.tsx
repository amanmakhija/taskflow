import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Folder, Trash2, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { projectsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import type { Project } from '@/types';

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 animate-fade-in overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Link to={`/projects/${project.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Folder className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Created {formatDate(project.created_at)}</span>
        </div>
      </Link>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Delete project"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CreateProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [nameErr, setNameErr] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => projectsApi.create({ name: name.trim(), description: desc.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setName('');
      setDesc('');
      toast({ title: 'Project created!' });
      onCreated();
    },
    onError: (e: any) => toast({ title: e.response?.data?.error || 'Failed to create project', variant: 'destructive' }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name is required'); return; }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameErr(''); }}
              error={nameErr}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description <span className="normal-case text-muted-foreground">(optional)</span></Label>
            <Input
              id="proj-desc"
              placeholder="What's this project about?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isPending}>Create project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const { mutate: deleteProject } = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project deleted' });
    },
    onError: () => toast({ title: 'Failed to delete project', variant: 'destructive' }),
  });

  const confirmDelete = (id: string) => {
    if (window.confirm('Delete this project and all its tasks?')) deleteProject(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-lg border border-border p-1 gap-0.5">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <CreateProjectDialog onCreated={() => {}} />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load projects</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => qc.invalidateQueries({ queryKey: ['projects'] })}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && projects?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Folder className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first project to start organizing tasks and collaborating with your team.
          </p>
          <CreateProjectDialog onCreated={() => {}} />
        </div>
      )}

      {/* Project grid/list */}
      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl'}`}>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={confirmDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
