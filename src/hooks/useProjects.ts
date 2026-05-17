import { useCallback, useEffect, useState } from 'react';
import {
  deleteProject as deleteProjectFromStorage,
  loadProjects,
  upsertProject,
} from '../utils/storage';
import type { ProductionProject } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<ProductionProject[]>([]);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const refresh = useCallback(() => {
    setProjects(loadProjects());
  }, []);

  const save = useCallback((project: ProductionProject) => {
    const next = upsertProject(project);
    setProjects(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = deleteProjectFromStorage(id);
    setProjects(next);
  }, []);

  return { projects, refresh, save, remove };
}
