import type { ProductionProject } from '../types';

const STORAGE_KEY = 'aipt.projects.v1';

export function loadProjects(): ProductionProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductionProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to load projects from localStorage', err);
    return [];
  }
}

export function saveProjects(projects: ProductionProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage', err);
  }
}

export function upsertProject(project: ProductionProject): ProductionProject[] {
  const all = loadProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx === -1) all.unshift(project);
  else all[idx] = project;
  saveProjects(all);
  return all;
}

export function deleteProject(id: string): ProductionProject[] {
  const all = loadProjects().filter((p) => p.id !== id);
  saveProjects(all);
  return all;
}

export function getProject(id: string): ProductionProject | undefined {
  return loadProjects().find((p) => p.id === id);
}
