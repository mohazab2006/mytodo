import { z } from 'zod';

export const taskTypeSchema = z.enum([
  'Assignment',
  'Tutorial',
  'Quiz',
  'Midterm',
  'Exam',
  'Final',
  'Lab',
  'Reading',
  'Project',
  'Other',
]);

export const taskStatusSchema = z.enum(['todo', 'doing', 'done']);

export const taskSourceSchema = z.enum(['manual', 'imported-outline', 'ai-generated']);

export const prioritySchema = z.enum(['low', 'medium', 'high']);

export const courseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  term: z.string().min(1, 'Term is required'),
  target_grade_default: z.number().min(0).max(100).optional().default(90),
  color: z.string().optional().default('#6B7280'),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  due_at: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  course_id: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
}).passthrough();

export const subtaskSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

