import { getDatabase, executeWithRetry } from './client';
import { generateId } from '../lib/utils';
import type { Course, CreateCourseInput, UpdateCourseInput } from '../lib/types';

export async function getAllCourses(): Promise<Course[]> {
  const db = await getDatabase();
  const courses = await db.select<Course[]>(
    'SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
  return courses;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const db = await getDatabase();
  const courses = await db.select<Course[]>(
    'SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return courses[0] || null;
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await executeWithRetry(
    `INSERT INTO courses (id, code, name, term, target_grade_default, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.code,
      input.name,
      input.term,
      input.target_grade_default ?? 90,
      (input as any).color || '#6B7280',
      now,
      now,
    ]
  );

  const course = await getCourseById(id);
  if (!course) throw new Error('Failed to create course');
  return course;
}

export async function updateCourse(input: UpdateCourseInput): Promise<Course> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (input.code !== undefined) {
    updates.push('code = ?');
    values.push(input.code);
  }
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.term !== undefined) {
    updates.push('term = ?');
    values.push(input.term);
  }
  if (input.target_grade_default !== undefined) {
    updates.push('target_grade_default = ?');
    values.push(input.target_grade_default);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(input.id);

  await executeWithRetry(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const course = await getCourseById(input.id);
  if (!course) throw new Error('Failed to update course');
  return course;
}

export async function deleteCourse(id: string): Promise<void> {
  const now = new Date().toISOString();
  // Soft-delete the course, but keep tasks.
  // Unlink tasks from this course but keep them in the School workspace.
  await executeWithRetry("UPDATE tasks SET course_id = NULL, workspace = 'school' WHERE course_id = ?", [id]);
  await executeWithRetry('UPDATE courses SET deleted_at = ? WHERE id = ?', [now, id]);
}

