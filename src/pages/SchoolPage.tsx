import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks } from '../hooks/useTasks';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import { courseSchema } from '../lib/validation';
import SchoolTaskModal from '../components/tasks/SchoolTaskModal';
import ColorPicker from '../components/ui/ColorPicker';
import SchoolTasksTable from '../components/school/SchoolTasksTable';
import type { CreateCourseInput, Course } from '../lib/types';
import TaskTypesModal from '../components/school/TaskTypesModal';

export default function SchoolPage() {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unchecked' | 'checked' | 'all'>('unchecked');
  const [isTypesOpen, setIsTypesOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>(''); // empty = all types
  
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({
    includeCompleted: statusFilter !== 'unchecked',
    ...(statusFilter === 'checked' ? { status: 'done' } : {}),
    workspace: 'school',
    ...(typeFilter ? { types: [typeFilter] } : {}),
  });
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateCourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: { code: '', name: '', term: '', target_grade_default: 90, color: '#6B7280' },
  });
  
  const selectedColor = watch('color');

  useEffect(() => {
    if (selectedCourseId && !courses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(null);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (editingCourse) {
      reset({
        code: editingCourse.code,
        name: editingCourse.name,
        term: editingCourse.term,
        target_grade_default: editingCourse.target_grade_default,
        color: editingCourse.color || '#6B7280',
      });
    }
  }, [editingCourse, reset]);

  const onSubmitCourse = async (data: CreateCourseInput) => {
    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({ id: editingCourse.id, ...data });
        setEditingCourse(null);
      } else {
        await createCourse.mutateAsync(data);
      }
      reset();
      setIsCreatingCourse(false);
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await deleteCourse.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  if (tasksLoading || coursesLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const baseSchoolTasks = selectedCourseId
    ? allTasks.filter((task) => task.course_id === selectedCourseId)
    : allTasks;

  const schoolTasks =
    statusFilter === 'all'
      ? baseSchoolTasks
      : statusFilter === 'checked'
        ? baseSchoolTasks.filter((t) => t.status === 'done')
        : baseSchoolTasks.filter((t) => t.status !== 'done');

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">School</h1>
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Courses</h2>
          <button
            onClick={() => setIsCreatingCourse(true)}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-md"
          >
            + New Course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-muted-foreground text-sm">No courses yet. Create one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourseId(selectedCourseId === course.id ? null : course.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCourseId === course.id
                    ? 'bg-muted'
                    : 'hover:bg-muted'
                }`}
                style={{ 
                  borderColor: course.color || '#6B7280',
                  backgroundColor: selectedCourseId === course.id 
                    ? `${course.color}15` 
                    : 'transparent'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{course.code}</h3>
                    <p className="text-sm text-muted-foreground">{course.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{course.term}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(course.id);
                    }}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(isCreatingCourse || editingCourse) && (
          <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
            <h3 className="font-semibold mb-3">{editingCourse ? 'Edit Course' : 'New Course'}</h3>
            <form onSubmit={handleSubmit(onSubmitCourse)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    {...register('code')}
                    placeholder="Course Code (e.g., COMP2401)"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <input
                    {...register('term')}
                    placeholder="Term (e.g., Winter 2026)"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                  {errors.term && <p className="text-xs text-red-500 mt-1">{errors.term.message}</p>}
                </div>
              </div>
              <input
                {...register('name')}
                placeholder="Course Name"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <ColorPicker 
                  value={selectedColor || '#6B7280'} 
                  onChange={(color) => setValue('color', color)} 
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCourse(false);
                    setEditingCourse(null);
                    reset();
                  }}
                  className="px-3 py-1.5 text-sm bg-secondary rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded">
                  {editingCourse ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {selectedCourseId
              ? `Tasks - ${courses.find((c) => c.id === selectedCourseId)?.code ?? 'Course'}`
              : 'All School Tasks'}
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-muted/40"
              title="Filter by type"
            >
              <option value="">All Types</option>
              {Array.from(new Set(allTasks.map((t) => t.type))).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setStatusFilter('unchecked')}
                className={`px-3 py-1.5 text-sm ${
                  statusFilter === 'unchecked' ? 'bg-muted' : 'bg-background hover:bg-muted'
                }`}
              >
                Unchecked
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('checked')}
                className={`px-3 py-1.5 text-sm border-l border-border ${
                  statusFilter === 'checked' ? 'bg-muted' : 'bg-background hover:bg-muted'
                }`}
              >
                Checked
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-sm border-l border-border ${
                  statusFilter === 'all' ? 'bg-muted' : 'bg-background hover:bg-muted'
                }`}
              >
                All
              </button>
            </div>

            <button
              onClick={() => setIsCreatingTask(true)}
              className="px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-md"
            >
              + New Task
            </button>

            <button
              type="button"
              onClick={() => setIsTypesOpen(true)}
              className="px-3 py-1.5 text-sm border border-border bg-muted/40 hover:bg-muted rounded-md"
              title="Manage task types"
            >
              Types
            </button>
          </div>
        </div>
        <SchoolTasksTable tasks={schoolTasks} />
      </div>
      
      <SchoolTaskModal
        isOpen={isCreatingTask}
        onClose={() => setIsCreatingTask(false)}
      />

      <TaskTypesModal isOpen={isTypesOpen} onClose={() => setIsTypesOpen(false)} />
    </div>
  );
}

