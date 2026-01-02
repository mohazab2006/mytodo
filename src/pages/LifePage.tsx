import { useMemo, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';
import LifeTaskModal from '../components/tasks/LifeTaskModal';
import { useLifeCategories } from '../hooks/useLifeCategories';
import LifeCategoriesModal from '../components/life/LifeCategoriesModal';

export default function LifePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unchecked' | 'checked' | 'all'>('unchecked');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const { data: allTasks = [], isLoading } = useTasks({
    includeCompleted: statusFilter !== 'unchecked',
    ...(statusFilter === 'checked' ? { status: 'done' } : {}),
    workspace: 'life',
  });
  const { data: categories = [] } = useLifeCategories();

  // Filter to only tasks without a course_id (life tasks)
  const lifeTasks = useMemo(() => allTasks, [allTasks]);
  const filteredTasks = useMemo(() => {
    const byCategory = selectedCategoryId
      ? lifeTasks.filter((t) => (t as any).life_category_id === selectedCategoryId)
      : lifeTasks;
    if (statusFilter === 'all') return byCategory;
    if (statusFilter === 'checked') return byCategory.filter((t) => t.status === 'done');
    return byCategory.filter((t) => t.status !== 'done');
  }, [lifeTasks, selectedCategoryId, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Life</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedCategoryId ?? ''}
            onChange={(e) => setSelectedCategoryId(e.target.value || null)}
            className="px-3 py-2 rounded-md border border-border bg-muted/40 text-sm"
            title="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setStatusFilter('unchecked')}
              className={`px-3 py-1.5 text-sm ${
                statusFilter === 'unchecked' ? 'bg-muted' : 'bg-background hover:bg-muted'
              }`}
            >
              Unchecked
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked')}
              className={`px-3 py-1.5 text-sm border-l border-border ${
                statusFilter === 'checked' ? 'bg-muted' : 'bg-background hover:bg-muted'
              }`}
            >
              Checked
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm border-l border-border ${
                statusFilter === 'all' ? 'bg-muted' : 'bg-background hover:bg-muted'
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            New Life Task
          </button>

          <button
            type="button"
            onClick={() => setIsCategoriesOpen(true)}
            className="px-3 py-2 rounded-md border border-border bg-muted/40 hover:bg-muted text-sm"
            title="Manage categories"
          >
            Categories
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <TaskList tasks={filteredTasks} />
      )}
      
      <LifeTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />

      <LifeCategoriesModal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />
    </div>
  );
}

