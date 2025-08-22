export interface FileStructure {
  [key: string]: { code: string };
  'index.html': { code: string };
  'style.css': { code: string };
  'index.js': { code: string };
}