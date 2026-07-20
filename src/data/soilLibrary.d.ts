declare module "@/data/soilLibrary" {
  export interface SoilLibraryEntry {
    id: string;
    name: string;
    shortName: string;
    mix: string;
    characteristics: string;
    bestFor: string;
    ph: string;
    color: string;
    useWhen: string;
  }
  export const soilLibrary: SoilLibraryEntry[];
  export function defaultSoilByTree(tree: {
    tags?: string[];
    foliage?: string;
    climate?: string;
  }): string;
}
