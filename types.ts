export interface Glyph {
  d: string;
  ax: number;
}

export interface FontMetrics {
  em: number;
  asc: number;
  desc: number;
  fam: string;
}

export interface FontData {
  G: Record<string, Glyph>;
  H: Record<string, Glyph>; // Hex map for MathJax
  metrics: FontMetrics;
  ready: boolean;
}

export type BlockType = 'h' | 'p' | 'bm' | 'hr' | 'e';

export interface ParseBlock {
  t: BlockType;
  c?: string;
  l?: number; // Heading level
}

export interface InlineSegment {
  t: 't' | 'm'; // text or math
  c: string;
}
