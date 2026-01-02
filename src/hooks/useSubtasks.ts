import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as subtasksRepo from '../db/subtasks.repo';
import type { CreateSubtaskInput, UpdateSubtaskInput } from '../lib/types';

export function useSubtasks(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtasksRepo.getSubtasksByTaskId(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubtaskInput) => subtasksRepo.createSubtask(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSubtaskInput) => subtasksRepo.updateSubtask(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
      subtasksRepo.deleteSubtask(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] });
    },
  });
}

export function useReorderSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, subtaskIds }: { taskId: string; subtaskIds: string[] }) =>
      subtasksRepo.reorderSubtasks(taskId, subtaskIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] });
    },
  });
}

