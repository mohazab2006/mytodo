import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Task, TaskWithCourse } from '../../lib/types';
import { TaskType, TaskStatus, Priority } from '../../lib/types';
import { taskSchema } from '../../lib/validation';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useCourses } from '../../hooks/useCourses';
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../hooks/useSubtasks';

interface TaskModalProps {
  task?: TaskWithCourse;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          due_at: task.due_at || '',
          type: task.type,
          course_id: task.course_id || '',
          status: task.status,
          priority_manual: task.priority_manual || undefined,
          effort_estimate_minutes: task.effort_estimate_minutes || undefined,
          tags: task.tags || '',
        }
      : {
          title: '',
          description: '',
          due_at: '',
          type: 'other',
          course_id: '',
          status: 'todo',
          priority_manual: undefined,
          effort_estimate_minutes: undefined,
          tags: '',
        },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        due_at: task.due_at || '',
        type: task.type,
        course_id: task.course_id || '',
        status: task.status,
        priority_manual: task.priority_manual || undefined,
        effort_estimate_minutes: task.effort_estimate_minutes || undefined,
        tags: task.tags || '',
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          ...data,
          course_id: data.course_id || null,
          due_at: data.due_at || null,
        });
      } else {
        await createTask.mutateAsync({
          ...data,
          course_id: data.course_id || null,
          due_at: data.due_at || null,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;
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
      await updateSubtask.mutateAsync({
        id: subtaskId,
        done: !done,
      });
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
              {isEditing ? 'Edit Task' : 'Create Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Due Date
                </label>
                <input
                  {...register('due_at')}
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.values(TaskType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Course
                </label>
                <select
                  {...register('course_id')}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None (Life task)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  {...register('priority_manual')}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None</option>
                  {Object.values(Priority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Effort (minutes)
                </label>
                <input
                  {...register('effort_estimate_minutes', {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tags (comma-separated)
              </label>
              <input
                {...register('tags')}
                placeholder="homework, urgent, reading"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Subtasks section */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subtasks
                </label>
                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSubtask(subtask.id, subtask.done)
                        }
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          subtask.done
                            ? 'bg-primary border-primary'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {subtask.done && (
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 ${
                          subtask.done ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {subtask.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    Delete Task
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
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

