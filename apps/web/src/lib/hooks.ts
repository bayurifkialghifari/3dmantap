import { useQuery } from '@tanstack/react-query';
import { api, getTemplates, getSettings } from './api';
export const useTemplates = () =>
  useQuery({ queryKey: ['templates'], queryFn: getTemplates, staleTime: 60000 });
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: getSettings });
export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api<{ user: { id: string; name: string; email: string } | null; role: string }>('/me'),
    retry: false,
  });
