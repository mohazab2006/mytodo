import { getDatabase } from './client';
import { generateId } from '../lib/utils';
import type { Subtask, CreateSubtaskInput, UpdateSubtaskInput } from '../lib/types';

export async function getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
  const db = await getDatabase();
  const subtasks = await db.select<Subtask[]>(
    'SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index ASC',
    [taskId]
  );
  return subtasks.map(st => ({
    ...st,
    done: Boolean(st.done),
  }));
}

export async function createSubtask(input: CreateSubtaskInput): Promise<Subtask> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Get the max order_index for this task
  const maxOrder = await db.select<{ max_order: number }[]>(
    'SELECT COALESCE(MAX(order_index), -1) as max_order FROM subtasks WHERE task_id = ?',
    [input.task_id]
  );
  const orderIndex = input.order_index ?? (maxOrder[0]?.max_order ?? -1) + 1;

  await db.execute(
    `INSERT INTO subtasks (id, task_id, text, done, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.task_id, input.text, 0, orderIndex, now, now]
  );

  const subtasks = await db.select<Subtask[]>(
    'SELECT * FROM subtasks WHERE id = ?',
    [id]
  );
  
  const subtask = subtasks[0];
  if (!subtask) throw new Error('Failed to create subtask');
  
  return {
    ...subtask,
    done: Boolean(subtask.done),
  };
}

export async function updateSubtask(input: UpdateSubtaskInput): Promise<Subtask> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (input.text !== undefined) {
    updates.push('text = ?');
    values.push(input.text);
  }
  if (input.done !== undefined) {
    updates.push('done = ?');
    values.push(input.done ? 1 : 0);
  }
  if (input.order_index !== undefined) {
    updates.push('order_index = ?');
    values.push(input.order_index);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(input.id);

  await db.execute(
    `UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const subtasks = await db.select<Subtask[]>(
    'SELECT * FROM subtasks WHERE id = ?',
    [input.id]
  );
  
  const subtask = subtasks[0];
  if (!subtask) throw new Error('Failed to update subtask');
  
  return {
    ...subtask,
    done: Boolean(subtask.done),
  };
}

export async function deleteSubtask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM subtasks WHERE id = ?', [id]);
}

export async function reorderSubtasks(taskId: string, subtaskIds: string[]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  for (let i = 0; i < subtaskIds.length; i++) {
    await db.execute(
      'UPDATE subtasks SET order_index = ?, updated_at = ? WHERE id = ? AND task_id = ?',
      [i, now, subtaskIds[i], taskId]
    );
  }
}

