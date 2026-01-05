import { useState } from 'react';
import type { TaskWithCourse } from '../../lib/types';
import { formatDueDate, isOverdue } from '../../lib/dates';
import { useUpdateTask } from '../../hooks/useTasks';
import SchoolTaskModal from './SchoolTaskModal';
import LifeTaskModal from './LifeTaskModal';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import { buildTaskTypeColorMap } from '../../lib/taskTypeColors';
import { useSubtasks, useCreateSubtask, useUpdateSubtask } from '../../hooks/useSubtasks';

interface TaskRowProps {
  task: TaskWithCourse;
}

const fallbackTypeColors: Record<string, string> = {
  Assignment: '#16A34A',
  Exam: '#DC2626',
  Quiz: '#EA580C',
  Midterm: '#9333EA',
  Final: '#DC2626',
  Lab: '#0D9488',
  Tutorial: '#CA8A04',
  Reading: '#2563EB',
  Project: '#DB2777',
  Other: '#6B7280',
};

export default function TaskRow({ task }: TaskRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const updateTask = useUpdateTask();
  const { data: taskTypes = [] } = useTaskTypes();
  const typeColorMap = taskTypes.length ? buildTaskTypeColorMap(taskTypes) : fallbackTypeColors;
  const { data: subtasks = [] } = useSubtasks(task.id, showSubtasks);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: task.status === 'done' ? 'todo' : 'done',
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const isDone = task.status === 'done';
  const overdue = isOverdue(task.due_at);
  const isLife = task.workspace === 'life';
  const isSchool = task.workspace === 'school';

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded cursor-pointer transition-colors group"
        style={{
          borderLeft:
            isLife && task.lifeCategory?.color ? `3px solid ${task.lifeCategory.color}` : undefined,
          paddingLeft: isLife ? '0.5rem' : undefined,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtasks((v) => !v);
          }}
          className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
          title={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
        >
          {showSubtasks ? '▾' : '▸'}
        </button>

        <button
          onClick={handleToggleComplete}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
            isDone
              ? 'bg-foreground border-foreground'
              : 'border-muted-foreground/30 hover:border-foreground/50'
          }`}
        >
          {isDone && (
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

        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-medium ${
                  isDone ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </span>

              {overdue && !isDone && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] border border-red-500/30 bg-red-500/10 text-red-500">
                  Overdue
                </span>
              )}

              {task.course && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-border bg-muted text-foreground/90">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: task.course.color || '#6B7280' }}
                  />
                  {task.course.code}
                </span>
              )}

              {isLife && task.lifeCategory && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-border bg-muted text-foreground/90">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: task.lifeCategory.color || '#6B7280' }}
                  />
                  {task.lifeCategory.name}
                </span>
              )}

              {isSchool && task.type && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-border bg-muted text-foreground/90">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: typeColorMap[task.type] || '#6B7280' }}
                  />
                  {task.type}
                </span>
              )}
            </div>

            {task.due_at && (
              <div
                className={`text-sm mt-1 ${
                  overdue && !isDone
                    ? 'text-red-500 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {formatDueDate(task.due_at)}
              </div>
            )}
          </div>

          {task.description && (
            <div className="text-sm text-foreground/90 max-w-[400px] truncate flex-shrink-0 font-normal border-l border-border pl-3 ml-2">
              {task.description}
            </div>
          )}
        </div>
      </div>

      {/* Indented subtasks (Notion-style) */}
      {showSubtasks && (
        <div className="ml-10 mt-1 space-y-1">
          {subtasks.map((st) => (
            <div
              key={st.id}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60"
            >
              <button
                type="button"
                onClick={() => updateSubtask.mutate({ id: st.id, done: !st.done })}
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  st.done ? 'bg-foreground border-foreground' : 'border-muted-foreground/40'
                }`}
                title="Toggle subtask"
              >
                {st.done ? <span className="text-background text-xs">✓</span> : null}
              </button>
              <div className={`text-sm ${st.done ? 'line-through text-muted-foreground' : ''}`}>
                {st.text}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-4 h-4" />
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask…"
              className="flex-1 px-2 py-1 text-sm bg-transparent border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const text = newSubtask.trim();
                  if (!text) return;
                  createSubtask.mutate({ task_id: task.id, text });
                  setNewSubtask('');
                }
              }}
            />
          </div>
        </div>
      )}

      {isModalOpen && (isSchool ? (
        <SchoolTaskModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      ) : (
        <LifeTaskModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      ))}
    </>
  );
}

