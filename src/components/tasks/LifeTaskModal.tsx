import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { TaskWithCourse } from '../../lib/types';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../hooks/useSubtasks';
import { useLifeCategories } from '../../hooks/useLifeCategories';
import { useCreateLifeCategory } from '../../hooks/useLifeCategories';

interface LifeTaskModalProps {
  task?: TaskWithCourse;
  isOpen: boolean;
  onClose: () => void;
}

export default function LifeTaskModal({ task, isOpen, onClose }: LifeTaskModalProps) {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const isEditing = !!task;

  const { data: subtasks = [] } = useSubtasks(task?.id || '');
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const { data: lifeCategories = [] } = useLifeCategories();
  const createLifeCategory = useCreateLifeCategory();

  const emptyDefaults = {
    title: '',
    description: '',
    due_at: '',
    life_category_id: '',
    life_category_name: '',
  };

  const { register, handleSubmit, reset, setValue, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          due_at: task.due_at || '',
          life_category_id: (task as any).life_category_id || '',
          life_category_name: task.lifeCategory?.name || '',
        }
      : emptyDefaults,
  });

  const ensureCategoryExists = async () => {
    const current = (getValues('life_category_id') || '').trim();
    if (!current) return;
    // We store the selected category by id, but allow typing a new name into this field using a separate input.
  };

  useEffect(() => {
    // When opening, always reset the form so "New Task" is a fresh blank form.
    if (!isOpen) return;
    setNewSubtaskText('');
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        due_at: task.due_at || '',
        life_category_id: (task as any).life_category_id || '',
        life_category_name: task.lifeCategory?.name || '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [isOpen, task, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          ...data,
          due_at: data.due_at || null,
          life_category_id: data.life_category_id || null,
        });
      } else {
        await createTask.mutateAsync({
          ...data,
          due_at: data.due_at || null,
          status: 'todo',
          type: 'Other',
          life_category_id: data.life_category_id || null,
          workspace: 'life',
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task?')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskText.trim()) return;
    try {
      await createSubtask.mutateAsync({
        task_id: task.id,
        text: newSubtaskText.trim(),
      });
      setNewSubtaskText('');
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, done: boolean) => {
    if (!task) return;
    try {
      await updateSubtask.mutateAsync({ id: subtaskId, done: !done });
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    try {
      await deleteSubtask.mutateAsync({ id: subtaskId, taskId: task.id });
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              {/* Notion-style: type to pick by name, create on Enter/blur, but store the selected id */}
              <input
                {...register('life_category_name')}
                list="life-categories"
                placeholder="Type to select or create…"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const name = (getValues('life_category_name') || '').trim();
                    if (!name) return;
                    const existing = lifeCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());
                    if (existing) {
                      setValue('life_category_id', existing.id, { shouldDirty: true });
                      setValue('life_category_name', existing.name, { shouldDirty: true });
                      return;
                    }
                    const created = await createLifeCategory.mutateAsync({ name });
                    setValue('life_category_id', created.id, { shouldDirty: true });
                    setValue('life_category_name', created.name, { shouldDirty: true });
                  }
                }}
                onBlur={async () => {
                  const val = (getValues('life_category_name') || '').trim();
                  if (!val) return;
                  // If user typed a name, convert to id.
                  const existing = lifeCategories.find((c) => c.name.toLowerCase() === val.toLowerCase());
                  if (existing) {
                    setValue('life_category_id', existing.id, { shouldDirty: true });
                    setValue('life_category_name', existing.name, { shouldDirty: true });
                  }
                }}
              />
              <datalist id="life-categories">
                {lifeCategories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {/* hidden field that actually gets saved */}
              <input type="hidden" {...register('life_category_id')} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                {...register('due_at')}
                type="datetime-local"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">Subtasks</label>
                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(subtask.id, subtask.done)}
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          subtask.done ? 'bg-foreground border-foreground' : 'border-muted-foreground/30'
                        }`}
                      >
                        {subtask.done && <span className="text-background text-xs">✓</span>}
                      </button>
                      <span className={subtask.done ? 'line-through text-muted-foreground' : ''}>
                        {subtask.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="ml-auto text-muted-foreground hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Avoid nested <form> which breaks submit behavior */}
                <div className="flex gap-2">
                  <input
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddSubtask} className="px-4 py-2 bg-secondary rounded-lg text-sm">
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                {isEditing && (
                  <button type="button" onClick={handleDelete} className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                  {isEditing ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

