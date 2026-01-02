import { getDatabase } from './client';
import { generateId } from '../lib/utils';
import type { LifeCategory } from '../lib/types';

export async function getLifeCategories(): Promise<LifeCategory[]> {
  const db = await getDatabase();
  return await db.select<LifeCategory[]>(
    'SELECT * FROM life_categories WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
}

export async function createLifeCategory(input: { name: string; color?: string }): Promise<LifeCategory> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const color = input.color ?? '#6B7280';

  await db.execute(
    `INSERT INTO life_categories (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name.trim(), color, now, now]
  );

  const rows = await db.select<LifeCategory[]>('SELECT * FROM life_categories WHERE id = ?', [id]);
  if (!rows[0]) throw new Error('Failed to create category');
  return rows[0];
}

export async function deleteLifeCategory(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.execute('UPDATE life_categories SET deleted_at = ? WHERE id = ?', [now, id]);
  // Optionally unlink tasks that referenced it (keep tasks)
  await db.execute('UPDATE tasks SET life_category_id = NULL WHERE life_category_id = ?', [id]);
}

export async function updateLifeCategory(input: { id: string; name?: string; color?: string }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name.trim());
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(input.id);

  await db.execute(`UPDATE life_categories SET ${updates.join(', ')} WHERE id = ?`, values);
}


