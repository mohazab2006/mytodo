import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import { courseSchema } from '../lib/validation';
import type { CreateCourseInput, Course } from '../lib/types';

export default function CoursesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: '',
      name: '',
      term: '',
      target_grade_default: 90,
    },
  });

  useEffect(() => {
    if (editingCourse) {
      reset({
        code: editingCourse.code,
        name: editingCourse.name,
        term: editingCourse.term,
        target_grade_default: editingCourse.target_grade_default,
      });
    } else {
      reset({
        code: '',
        name: '',
        term: '',
        target_grade_default: 90,
      });
    }
  }, [editingCourse, reset]);

  const onSubmit = async (data: CreateCourseInput) => {
    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({
          id: editingCourse.id,
          ...data,
        });
        setEditingCourse(null);
      } else {
        await createCourse.mutateAsync(data);
        setIsCreating(false);
      }
      reset();
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Add Course
        </button>
      </div>

      {(isCreating || editingCourse) && (
        <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('code')}
                  placeholder="e.g., COMP2401"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.code && (
                  <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('term')}
                  placeholder="e.g., Winter 2026"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.term && (
                  <p className="text-sm text-red-500 mt-1">{errors.term.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="e.g., Systems Programming"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Target Grade (%)
              </label>
              <input
                {...register('target_grade_default', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.target_grade_default && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.target_grade_default.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCourse(null);
                  reset();
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No courses yet. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 bg-muted rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{course.code}</h3>
                  <p className="text-sm text-muted-foreground">{course.term}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCourse(course)}
                    className="text-muted-foreground hover:text-primary"
                    title="Edit course"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-muted-foreground hover:text-red-500"
                    title="Delete course"
                  >
                    <svg
                      className="w-5 h-5"
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
              </div>
              <p className="text-sm mb-2">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                Target: {course.target_grade_default}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

