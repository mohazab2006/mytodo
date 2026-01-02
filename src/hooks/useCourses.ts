import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as coursesRepo from '../db/courses.repo';
import type { CreateCourseInput, UpdateCourseInput } from '../lib/types';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesRepo.getAllCourses(),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesRepo.getCourseById(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCourseInput) => coursesRepo.createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCourseInput) => coursesRepo.updateCourse(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', data.id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => coursesRepo.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      // Course deletion unlinks tasks; refresh task lists immediately.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

