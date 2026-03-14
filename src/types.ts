/** Proje form verisi (wizard + AI sonuçları) */
export interface ProjectData {
  type?: string;
  area?: string;
  plot?: string;
  floors?: string;
  rooms?: string;
  loc?: string;
  budget?: string;
  style?: string;
  mats?: string[];
  lights?: string[];
  sus?: string[];
  master?: string;
  custom?: string;
  locDetail?: string;
}

/** Ana AI konsept sonucu */
export interface AIConceptResult {
  ozet?: string;
  odaYerlesimi?: string;
  oneri?: string;
  mjPrompt?: string;
}
