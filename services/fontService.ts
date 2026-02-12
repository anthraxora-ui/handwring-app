import { FontData, Glyph } from '../types';

export const parseFontData = (svgText: string): FontData => {
  const parser = new DOMParser();
  const d = parser.parseFromString(svgText, 'image/svg+xml');
  
  if (d.querySelector('parsererror')) {
    throw new Error('SVG parse error');
  }

  const f = d.querySelector('font');
  if (!f) throw new Error('No <font> tag found');

  const defaultAdv = +(f.getAttribute('horiz-adv-x') || 500);
  const ff = d.querySelector('font-face');
  
  const metrics = {
    em: +(ff?.getAttribute('units-per-em') || 1000),
    asc: +(ff?.getAttribute('ascent') || 800),
    desc: +(ff?.getAttribute('descent') || -200),
    fam: ff?.getAttribute('font-family') || 'QEKunjarScript'
  };

  const G: Record<string, Glyph> = {};
  const H: Record<string, Glyph> = {};
  
  let count = 0;
  d.querySelectorAll('glyph').forEach((g) => {
    const u = g.getAttribute('unicode');
    if (!u) return;
    
    const e: Glyph = {
      d: g.getAttribute('d') || '',
      ax: +(g.getAttribute('horiz-adv-x') || defaultAdv)
    };

    G[u] = e;
    
    // Store hex code for MathJax replacement logic
    if (u.length === 1 || (u.length === 2 && (u.codePointAt(0) || 0) > 0xFFFF)) {
      const code = u.codePointAt(0)?.toString(16).toUpperCase();
      if (code) H[code] = e;
    }
    count++;
  });

  console.log(`Parsed ${count} glyphs`);

  return { G, H, metrics, ready: true };
};

export const generateSvgText = (text: string, size: number, color: string, fontData: FontData): string => {
  if (!text.trim() || !fontData.ready) return '';
  
  const { G, metrics } = fontData;
  const scale = size / metrics.em;
  let x = 0;
  const paths: string[] = [];

  for (const char of text) {
    const glyph = G[char] || { d: '', ax: 500 }; 
    if (glyph.d) {
      // transform="translate(x, asc) scale(sc, -sc)"
      const tx = (x * scale).toFixed(1);
      const ty = (metrics.asc * scale).toFixed(1);
      const scStr = scale.toFixed(6);
      const nScStr = (-scale).toFixed(6);
      
      paths.push(`<g transform="translate(${tx},${ty}) scale(${scStr},${nScStr})"><path d="${glyph.d}" fill="${color}"/></g>`);
    }
    x += glyph.ax;
  }

  const width = Math.ceil(x * scale + 4);
  const height = Math.ceil(size * 1.3); // Slightly taller box to prevent clipping ascenders
  
  // Vertical Align Adjustment
  // To make it look like writing on the line, we need the baseline to be consistent.
  // We use margin-bottom to pull the text down if needed, but 'vertical-align: baseline' usually works
  // if the SVG height is tight.
  // With line-height 34px and font-size 22px, we have 12px gap.
  // To center vertically: (34-22)/2 = 6px.
  // So we want the bottom of the letters to be around 6-8px from bottom of line.
  // This is roughly -0.15em.
  
  const verticalAlign = "-0.25em"; 

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:inline-block;vertical-align:${verticalAlign};overflow:visible;">${paths.join('')}</svg>`;
};
