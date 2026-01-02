// Enums
export const TaskType = {
  ASSIGNMENT: 'Assignment',
  TUTORIAL: 'Tutorial',
  QUIZ: 'Quiz',
  MIDTERM: 'Midterm',
  EXAM: 'Exam',
  FINAL: 'Final',
  LAB: 'Lab',
  READING: 'Reading',
  PROJECT: 'Project',
  OTHER: 'Other',
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskStatus = {
  TODO: 'todo',
  DOING: 'doing',
  DONE: 'done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskSource = {
  MANUAL: 'manual',
  IMPORTED_OUTLINE: 'imported-outline',
  AI_GENERATED: 'ai-generated',
} as const;

export type TaskSource = (typeof TaskSource)[keyof typeof TaskSource];

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

// Entities
export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  target_grade_default: number;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  type: TaskType;
  course_id: string | null;
  life_category_id?: string | null;
  workspace?: 'school' | 'life';
  status: TaskStatus;
  priority_manual: Priority | null;
  effort_estimate_minutes: number | null;
  tags: string | null;
  source: TaskSource;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  text: string;
  done: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Display types (with joins)
export interface TaskWithCourse extends Task {
  course?: Course;
  lifeCategory?: LifeCategory;
  subtasks?: Subtask[];
}

export interface LifeCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskTypeOption {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Form input types
export interface CreateCourseInput {
  code: string;
  name: string;
  term: string;
  target_grade_default?: number;
}

export interface UpdateCourseInput {
  id: string;
  code?: string;
  name?: string;
  term?: string;
  target_grade_default?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_at?: string;
  type?: TaskType;
  course_id?: string;
  life_category_id?: string;
  status?: TaskStatus;
  priority_manual?: Priority;
  effort_estimate_minutes?: number;
  tags?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  due_at?: string;
  type?: TaskType;
  course_id?: string;
  life_category_id?: string;
  status?: TaskStatus;
  priority_manual?: Priority;
  effort_estimate_minutes?: number;
  tags?: string;
}

export interface CreateSubtaskInput {
  task_id: string;
  text: string;
  order_index?: number;
}

export interface UpdateSubtaskInput {
  id: string;
  text?: string;
  done?: boolean;
  order_index?: number;
}

