import { useState } from 'react';
import { useCreateTask } from '../../hooks/useTasks';

export default function TopBar() {
  const [quickAddValue, setQuickAddValue] = useState('');
  const createTask = useCreateTask();

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;

    try {
      await createTask.mutateAsync({
        title: quickAddValue.trim(),
        status: 'todo',
      });
      setQuickAddValue('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="px-8 py-3">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="Add a task..."
              className="w-full px-3 py-2 bg-background border-none text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>
      </div>
    </header>
  );
}

