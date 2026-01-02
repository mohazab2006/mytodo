import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { TaskWithCourse } from '../../lib/types';
import { TaskType } from '../../lib/types';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useCourses } from '../../hooks/useCourses';
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../hooks/useSubtasks';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import { useCreateTaskType } from '../../hooks/useTaskTypes';

interface SchoolTaskModalProps {
  task?: TaskWithCourse;
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolTaskModal({ task, isOpen, onClose }: SchoolTaskModalProps) {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const isEditing = !!task;

  const { data: courses = [] } = useCourses();
  const { data: subtasks = [] } = useSubtasks(task?.id || '');
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const { data: taskTypes = [] } = useTaskTypes();
  const createTaskType = useCreateTaskType();

  const emptyDefaults = {
    title: '',
    description: '',
    due_at: '',
    type: '',
    course_id: '',
  };

  const { register, handleSubmit, reset, setValue, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          due_at: task.due_at || '',
          type: task.type,
          course_id: task.course_id || '',
        }
      : emptyDefaults,
  });

  useEffect(() => {
    // When opening, always reset the form so "New Task" is a fresh blank form.
    if (!isOpen) return;
    setNewSubtaskText('');
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        due_at: task.due_at || '',
        type: task.type,
        course_id: task.course_id || '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [isOpen, task, reset]);

  const onSubmit = async (data: any) => {
    try {
      const normalized = { ...data, type: (data.type || '').trim() || undefined };
      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          ...normalized,
          course_id: data.course_id || null,
          due_at: data.due_at || null,
        });
      } else {
        await createTask.mutateAsync({
          ...normalized,
          course_id: data.course_id || null,
          due_at: data.due_at || null,
          status: 'todo',
          workspace: 'school',
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const ensureTypeExists = async () => {
    const current = (getValues('type') || '').trim();
    if (!current) return;
    const exists = taskTypes.some((t) => t.name.toLowerCase() === current.toLowerCase());
    if (!exists) {
      const created = await createTaskType.mutateAsync({ name: current });
      // normalize to the stored casing
      setValue('type', created.name, { shouldDirty: true });
    } else {
      // normalize casing to the existing type name
      const found = taskTypes.find((t) => t.name.toLowerCase() === current.toLowerCase());
      if (found) setValue('type', found.name, { shouldDirty: true });
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
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit School Task' : 'New School Task'}
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
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                {...register('course_id')}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                {/* Notion-style: type to select, and if it doesn't exist, it will be created on Enter/blur */}
                <input
                  {...register('type')}
                  list="task-types"
                  placeholder="e.g. Exam"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ensureTypeExists();
                    }
                  }}
                  onBlur={() => {
                    ensureTypeExists();
                  }}
                />
                <datalist id="task-types">
                  {(taskTypes.length > 0
                    ? taskTypes.map((t) => t.name)
                    : Object.values(TaskType)
                  ).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  {...register('due_at')}
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
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

