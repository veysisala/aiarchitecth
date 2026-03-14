/**
 * Proje kaydetme / yükleme — localStorage
 */

const STORAGE_KEY = "architect_ai_projects";

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  data: Record<string, unknown>;
  res: Record<string, unknown> | null;
}

export interface ProjectList {
  list: SavedProject[];
}

function getStored(): ProjectList {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectList;
      if (Array.isArray(parsed?.list)) return parsed;
    }
  } catch (_) {}
  return { list: [] };
}

function setStored(pl: ProjectList): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pl));
  } catch (_) {}
}

export function listProjects(): SavedProject[] {
  return getStored().list;
}

export function saveProject(
  name: string,
  data: Record<string, unknown>,
  res: Record<string, unknown> | null
): SavedProject {
  const stored = getStored();
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const item: SavedProject = {
    id,
    name: name || "İsimsiz Proje",
    date: new Date().toISOString(),
    data,
    res,
  };
  stored.list.unshift(item);
  if (stored.list.length > 50) stored.list = stored.list.slice(0, 50);
  setStored(stored);
  return item;
}

export function loadProject(id: string): SavedProject | null {
  const list = getStored().list;
  return list.find((p) => p.id === id) ?? null;
}

export function deleteProject(id: string): void {
  const stored = getStored();
  stored.list = stored.list.filter((p) => p.id !== id);
  setStored(stored);
}
