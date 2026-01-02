import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as repo from '../db/lifeCategories.repo';

export function useLifeCategories() {
  return useQuery({
    queryKey: ['lifeCategories'],
    queryFn: () => repo.getLifeCategories(),
  });
}

export function useCreateLifeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) => repo.createLifeCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifeCategories'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteLifeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteLifeCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifeCategories'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateLifeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; color?: string }) => repo.updateLifeCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifeCategories'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}


