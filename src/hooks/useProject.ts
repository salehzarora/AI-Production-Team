import { useCallback, useEffect, useState } from 'react';
import { getProject, upsertProject } from '../utils/storage';
import type { ProductionProject } from '../types';

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<ProductionProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProject(null);
      setLoading(false);
      return;
    }
    const found = getProject(id);
    setProject(found ?? null);
    setLoading(false);
  }, [id]);

  const update = useCallback((next: ProductionProject) => {
    setProject(next);
    upsertProject(next);
  }, []);

  return { project, loading, update };
}
