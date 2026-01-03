import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks } from '../hooks/useTasks';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import { courseSchema } from '../lib/validation';
import SchoolTaskModal from '../components/tasks/SchoolTaskModal';
import ColorPicker from '../components/ui/ColorPicker';
import SchoolTasksTable from '../components/school/SchoolTasksTable';
import type { CreateCourseInput, Course, TaskWithCourse } from '../lib/types';
import TaskTypesModal from '../components/school/TaskTypesModal';
import {
  buildGradeWarnings,
  computeCurrentSoFar,
  computeNeededFinal,
  computeProjectedOverall,
  computeWeightStats,
} from '../services/gradeMath';
import { useUpsertTaskGrade } from '../hooks/useGrades';

export default function SchoolPage() {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unchecked' | 'checked' | 'all'>('unchecked');
  const [isTypesOpen, setIsTypesOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>(''); // empty = all types
  const [gradeFilter, setGradeFilter] = useState<
    'all' | 'graded' | 'ungraded' | 'missingGrade' | 'missingWeight' | 'excluded'
  >('all');
  const [minWeightFilter, setMinWeightFilter] = useState<string>(''); // % (optional)
  const [gradebookSort, setGradebookSort] = useState<'due' | 'weight' | 'type'>('due');
  
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({
    // IMPORTANT: completion status must never affect grade calculations.
    // Always fetch all school tasks; filter status client-side for display only.
    includeCompleted: true,
    workspace: 'school',
    ...(typeFilter ? { types: [typeFilter] } : {}),
  });
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const upsertGrade = useUpsertTaskGrade();

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

  const selectedCourse = selectedCourseId ? courses.find((c) => c.id === selectedCourseId) ?? null : null;

  const baseSchoolTasks = useMemo(() => {
    const scoped = selectedCourseId ? allTasks.filter((t) => t.course_id === selectedCourseId) : allTasks;

    const minW = minWeightFilter.trim() ? Number(minWeightFilter) : null;
    const filteredByGrade = scoped.filter((t) => {
      const counts = t.grade?.counts ?? true;
      const isGraded = t.grade?.is_graded ?? false;
      const w = t.grade?.weight_percent ?? null;
      const g = t.grade?.grade_percent ?? null;

      if (gradeFilter === 'excluded') return counts === false;
      if (gradeFilter === 'graded') return counts === true && isGraded === true;
      if (gradeFilter === 'ungraded') return counts === true && isGraded === false;
      if (gradeFilter === 'missingGrade') return counts === true && isGraded === true && (g === null || g === undefined);
      if (gradeFilter === 'missingWeight') return counts === true && (!w || Number(w) <= 0);

      return true;
    });

    if (minW !== null && Number.isFinite(minW)) {
      return filteredByGrade.filter((t) => {
        const w = t.grade?.weight_percent ?? null;
        return w !== null && Number(w) >= minW;
      });
    }
    return filteredByGrade;
  }, [allTasks, selectedCourseId, gradeFilter, minWeightFilter]);

  const schoolTasks = useMemo(() => {
    if (statusFilter === 'all') return baseSchoolTasks;
    if (statusFilter === 'checked') return baseSchoolTasks.filter((t) => t.status === 'done');
    return baseSchoolTasks.filter((t) => t.status !== 'done');
  }, [baseSchoolTasks, statusFilter]);

  const courseTasksAll: TaskWithCourse[] = useMemo(() => {
    if (!selectedCourseId) return [];
    return allTasks.filter((t) => t.course_id === selectedCourseId);
  }, [allTasks, selectedCourseId]);

  const finalTask = useMemo(() => {
    if (!selectedCourseId) return null;
    const finals = courseTasksAll
      .filter((t) => (t.type || '').toLowerCase() === 'final')
      .sort((a, b) => {
        const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
        return ad - bd;
      });
    return finals[0] ?? null;
  }, [courseTasksAll, selectedCourseId]);

  const gradeStats = useMemo(() => (selectedCourseId ? computeWeightStats(courseTasksAll) : null), [courseTasksAll, selectedCourseId]);
  const currentSoFar = useMemo(() => (selectedCourseId ? computeCurrentSoFar(courseTasksAll) : null), [courseTasksAll, selectedCourseId]);
  const projectedOverall = useMemo(() => (selectedCourseId ? computeProjectedOverall(courseTasksAll) : 0), [courseTasksAll, selectedCourseId]);

  const neededOnFinal = useMemo(() => {
    if (!selectedCourseId || !selectedCourse || !finalTask) return null;
    const wFinal = finalTask.grade?.weight_percent ?? null;
    if (wFinal === null || Number(wFinal) <= 0) return null;
    // Exclude the final itself from known contribution
    const nonFinal = courseTasksAll.filter((t) => t.id !== finalTask.id);
    const known = computeProjectedOverall(nonFinal); // already /100
    return computeNeededFinal({
      target: selectedCourse.target_grade_default ?? 90,
      knownContribution: known,
      finalWeightPercent: Number(wFinal),
    });
  }, [selectedCourseId, selectedCourse, finalTask, courseTasksAll]);

  const warnings = useMemo(() => {
    if (!selectedCourseId) return [];
    const baseWarnings = buildGradeWarnings({ tasks: courseTasksAll, finalTask });
    // Add warning if any items are excluded
    const excludedCount = courseTasksAll.filter((t) => (t.grade?.counts ?? true) === false).length;
    if (excludedCount > 0) {
      baseWarnings.push({
        kind: 'total_weight_over_100' as any, // reuse type for simplicity
        message: `${excludedCount} item${excludedCount > 1 ? 's are' : ' is'} excluded from grading.`,
        totalWeight: excludedCount,
      });
    }
    return baseWarnings;
  }, [courseTasksAll, finalTask, selectedCourseId]);

  const gradebookTasks = useMemo(() => {
    if (!selectedCourseId) return [];
    // Show everything for the course; filtering is controlled by gradeFilter/minWeightFilter above.
    const minW = minWeightFilter.trim() ? Number(minWeightFilter) : null;
    const filtered = courseTasksAll.filter((t) => {
      const counts = t.grade?.counts ?? true;
      const isGraded = t.grade?.is_graded ?? false;
      const w = t.grade?.weight_percent ?? null;
      const g = t.grade?.grade_percent ?? null;

      if (gradeFilter === 'excluded') return counts === false;
      if (gradeFilter === 'graded') return counts === true && isGraded === true;
      if (gradeFilter === 'ungraded') return counts === true && isGraded === false;
      if (gradeFilter === 'missingGrade') return counts === true && isGraded === true && (g === null || g === undefined);
      if (gradeFilter === 'missingWeight') return counts === true && (!w || Number(w) <= 0);
      return true;
    });

    const filtered2 =
      minW !== null && Number.isFinite(minW)
        ? filtered.filter((t) => {
            const w = t.grade?.weight_percent ?? null;
            return w !== null && Number(w) >= minW;
          })
        : filtered;

    const byDue = (a: TaskWithCourse, b: TaskWithCourse) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return a.title.localeCompare(b.title);
    };
    const byWeight = (a: TaskWithCourse, b: TaskWithCourse) => {
      const aw = Number(a.grade?.weight_percent ?? -1);
      const bw = Number(b.grade?.weight_percent ?? -1);
      if (aw !== bw) return bw - aw;
      return byDue(a, b);
    };
    const byType = (a: TaskWithCourse, b: TaskWithCourse) => {
      const at = String(a.type ?? '');
      const bt = String(b.type ?? '');
      const cmp = at.localeCompare(bt);
      if (cmp !== 0) return cmp;
      return byDue(a, b);
    };

    const sorted = [...filtered2].sort(
      gradebookSort === 'weight' ? byWeight : gradebookSort === 'type' ? byType : byDue
    );
    return sorted;
  }, [courseTasksAll, gradeFilter, gradebookSort, minWeightFilter, selectedCourseId]);

  const isLoading = tasksLoading || coursesLoading;
  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCourse(course);
                        setIsCreatingCourse(false);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      title="Edit course"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      className="text-muted-foreground hover:text-red-500"
                      title="Delete course"
                    >
                      ✕
                    </button>
                  </div>
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
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Grade (%)</label>
                  <input
                    {...register('target_grade_default', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="90"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                  {errors.target_grade_default && (
                    <p className="text-xs text-red-500 mt-1">{errors.target_grade_default.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <ColorPicker 
                    value={selectedColor || '#6B7280'} 
                    onChange={(color) => setValue('color', color)} 
                  />
                </div>
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

      {/* Course Grade Dashboard */}
      {selectedCourse ? (
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Course dashboard</div>
              <div className="text-2xl font-semibold">{selectedCourse.code}</div>
              <div className="text-sm text-muted-foreground">{selectedCourse.name}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Target: <span className="font-medium text-foreground">{selectedCourse.target_grade_default ?? 90}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Current (so far)</div>
              <div className="text-2xl font-semibold tabular-nums">
                {currentSoFar === null ? 'N/A' : `${currentSoFar.toFixed(1)}%`}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Projected overall</div>
              <div className="text-2xl font-semibold tabular-nums">{projectedOverall.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Completed weight</div>
              <div className="text-2xl font-semibold tabular-nums">
                {gradeStats ? `${gradeStats.completedWeight.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Needed on final</div>
              <div className="text-2xl font-semibold tabular-nums">
                {!finalTask
                  ? 'N/A'
                  : (finalTask.grade?.is_graded ?? false)
                    ? 'Final graded'
                    : neededOnFinal === null
                      ? 'Missing'
                      : neededOnFinal <= 0
                        ? '0.0%'
                        : `${neededOnFinal.toFixed(1)}%`}
              </div>
              {finalTask ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Final weight: {finalTask.grade?.weight_percent ?? '—'}%
                </div>
              ) : null}
            </div>
          </div>

          {warnings.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <span>⚠</span>
                <span>Warnings</span>
              </div>
              <div className="space-y-2">
                {warnings.slice(0, 6).map((w, idx) => (
                  <div key={idx} className="text-sm text-amber-700 dark:text-amber-300">
                    • {w.message}
                  </div>
                ))}
                {warnings.length > 6 ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400">+ {warnings.length - 6} more…</div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Gradebook */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Gradebook</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">Sort</div>
                <select
                  value={gradebookSort}
                  onChange={(e) => setGradebookSort(e.target.value as any)}
                  className="px-2 py-1 text-xs rounded-md border border-border bg-muted/40"
                  title="Sort gradebook"
                >
                  <option value="due">Due date</option>
                  <option value="weight">Weight</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1.4fr_120px_160px_110px_110px_130px_170px_80px] bg-muted text-xs font-medium text-muted-foreground">
                {['Task', 'Type', 'Due', 'Weight', 'Grade', 'Contribution', 'Flags', 'Include'].map((c) => (
                  <div key={c} className="px-3 py-2 border-r border-border last:border-r-0">
                    {c}
                  </div>
                ))}
              </div>

              <div className="divide-y divide-border">
                {gradebookTasks.map((t) => {
                  const counts = t.grade?.counts ?? true;
                  const isGraded = t.grade?.is_graded ?? false;
                  const w = t.grade?.weight_percent ?? null;
                  const g = t.grade?.grade_percent ?? null;
                  const contribution =
                    counts && isGraded && w !== null && Number(w) > 0 && g !== null && g !== undefined
                      ? (Number(g) * Number(w)) / 100
                      : null;

                  const handleToggleCounts = async () => {
                    if (!t.grade) {
                      // If no grade record exists, create one with counts=false
                      await upsertGrade.mutateAsync({
                        task_id: t.id,
                        weight_percent: null,
                        grade_percent: null,
                        is_graded: false,
                        counts: !counts,
                      });
                    } else {
                      // Update existing grade record
                      await upsertGrade.mutateAsync({
                        task_id: t.id,
                        weight_percent: w !== null && w !== undefined ? Number(w) : null,
                        grade_percent: g !== null && g !== undefined ? Number(g) : null,
                        is_graded: isGraded,
                        counts: !counts,
                      });
                    }
                  };

                  return (
                    <div
                      key={t.id}
                      className={`grid grid-cols-[1.4fr_120px_160px_110px_110px_130px_170px_80px] text-sm ${
                        counts ? 'hover:bg-muted/60' : 'bg-muted/10'
                      }`}
                      title={!counts ? 'Excluded from grading' : undefined}
                    >
                      <div className="px-3 py-2 border-r border-border truncate" title={t.title}>
                        {t.title}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground truncate">
                        {t.type || '—'}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground truncate">
                        {t.due_at ? new Date(t.due_at).toLocaleString() : '—'}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground tabular-nums">
                        {w === null || w === undefined ? '—' : `${Number(w).toFixed(1)}%`}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground tabular-nums">
                        {isGraded ? (g === null || g === undefined ? '—' : `${Number(g).toFixed(1)}%`) : '—'}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground tabular-nums">
                        {contribution === null ? '—' : `${contribution.toFixed(2)}%`}
                      </div>
                      <div className="px-3 py-2 border-r border-border text-muted-foreground text-xs">
                        {!counts ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted">
                            Excluded
                          </span>
                        ) : isGraded ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted">
                            Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted">
                            Ungraded
                          </span>
                        )}
                      </div>
                      <div className="px-3 py-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleToggleCounts}
                          className={`w-8 h-4 rounded-full transition-colors ${
                            counts ? 'bg-primary' : 'bg-muted-foreground/30'
                          } relative`}
                          title={counts ? 'Exclude from grading' : 'Include in grading'}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-background transition-transform ${
                              counts ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {gradebookTasks.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No items match your filters.</div>
                ) : null}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              Note: task completion (todo/doing/done) never affects grade calculations.
            </div>
          </div>
        </div>
      ) : null}

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
              {Array.from(new Set(allTasks.map((t) => t.type).filter(Boolean) as string[])).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-muted/40"
              title="Filter by grading state"
            >
              <option value="all">All grades</option>
              <option value="graded">Graded</option>
              <option value="ungraded">Ungraded</option>
              <option value="missingGrade">Missing grade</option>
              <option value="missingWeight">Missing weight</option>
              <option value="excluded">Excluded</option>
            </select>

            <input
              value={minWeightFilter}
              onChange={(e) => setMinWeightFilter(e.target.value)}
              inputMode="decimal"
              placeholder="Weight ≥"
              className="w-24 px-3 py-1.5 text-sm rounded-md border border-border bg-muted/40"
              title="Minimum weight (%)"
            />

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

