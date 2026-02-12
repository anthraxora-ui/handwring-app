import React, { useEffect, useRef, useState } from 'react';
import { FontData, BlockType, ParseBlock, InlineSegment } from '../types';
import { generateSvgText } from '../services/fontService';

interface PreviewProps {
  content: string;
  fontData: FontData;
}

// A4 Dimensions in mm
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 25.4; // 1 inch

// Measurement Constants
// We use a slightly higher DPI for calculation to ensure precision, but CSS uses mm.
const MM_TO_PX = 3.7795; 
const PAGE_HEIGHT_PX = Math.floor(PAGE_HEIGHT_MM * MM_TO_PX);
const MARGIN_TOP_PX = Math.floor(MARGIN_MM * MM_TO_PX); 
const MARGIN_BOTTOM_PX = Math.floor(MARGIN_MM * MM_TO_PX);

// Strict Line Height Grid
const LINE_HEIGHT = 34;
const AVAILABLE_HEIGHT_RAW = PAGE_HEIGHT_PX - MARGIN_TOP_PX - MARGIN_BOTTOM_PX;
const LINES_PER_PAGE = Math.floor(AVAILABLE_HEIGHT_RAW / LINE_HEIGHT);
const CONTENT_HEIGHT_PX = LINES_PER_PAGE * LINE_HEIGHT;

const CONTENT_PADDING_TOP = 6;

const parseDoc = (s: string): ParseBlock[] => {
  const blocks: ParseBlock[] = [];
  const lines = s.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const ln = lines[i].trimEnd();
    
    if (ln.trim() === '$$') {
      const m = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '$$') {
        m.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ t: 'bm', c: m.join('\n') });
      continue;
    }
    
    if (ln.trim() === '---' || ln.trim() === '***') {
      blocks.push({ t: 'hr' });
      i++;
      continue;
    }
    
    if (ln.startsWith('# ')) {
      blocks.push({ t: 'h', l: 1, c: ln.slice(2) });
      i++; continue;
    }
    if (ln.startsWith('## ')) {
      blocks.push({ t: 'h', l: 2, c: ln.slice(3) });
      i++; continue;
    }
    if (ln.startsWith('### ')) {
      blocks.push({ t: 'h', l: 3, c: ln.slice(4) });
      i++; continue;
    }
    
    if (!ln.trim()) {
      blocks.push({ t: 'e' });
      i++;
      continue;
    }
    
    blocks.push({ t: 'p', c: ln });
    i++;
  }
  return blocks;
};

const splitIM = (t: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  let rest = t;
  while (rest.length) {
    const a = rest.indexOf('$');
    if (a < 0) {
      segments.push({ t: 't', c: rest });
      break;
    }
    if (a > 0) {
      segments.push({ t: 't', c: rest.slice(0, a) });
    }
    const b = rest.indexOf('$', a + 1);
    if (b < 0) {
      segments.push({ t: 't', c: rest.slice(a) });
      break;
    }
    segments.push({ t: 'm', c: rest.slice(a + 1, b) });
    rest = rest.slice(b + 1);
  }
  return segments;
};

const Preview: React.FC<PreviewProps> = ({ content, fontData }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);

  const generateBlockHtml = (blocks: ParseBlock[]) => {
    let html = '';
    for (const b of blocks) {
      if (b.t === 'h') {
        const sz = b.l === 1 ? 36 : b.l === 2 ? 28 : 22;
        const segs = splitIM(b.c || '');
        let h = '';
        for (const s of segs) {
          if (s.t === 't') {
            h += generateSvgText(s.c, sz, '#1a1a2e', fontData);
          } else {
            h += `<span class="im" data-it="${encodeURIComponent(s.c)}"></span>`;
          }
        }
        
        let wrapperClass = "rb rh w-full";
        let style = '';
        if (b.l === 1) {
          style = 'margin-top: 34px; margin-bottom: 34px; line-height: 34px; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 8px;';
        } else {
          style = 'margin-top: 34px; margin-bottom: 0px; line-height: 34px;';
        }
        
        html += `<div class="${wrapperClass}" style="${style}">${h}</div>`;

      } else if (b.t === 'p') {
        const segs = splitIM(b.c || '');
        let innerHtml = '';
        
        segs.forEach(s => {
          if (s.t === 'm') {
            innerHtml += `<span class="im inline-block mx-1 align-baseline" data-it="${encodeURIComponent(s.c)}"></span>`;
          } else {
            const words = s.c.split(/(\s+)/);
            words.forEach(w => {
              if (w.match(/^\s+$/)) {
                 innerHtml += `<span class="inline-block w-[6px]"></span>`;
              } else if (w) {
                 const svg = generateSvgText(w, 22, '#1a1a2e', fontData);
                 innerHtml += `<span class="inline-block h-[34px] align-baseline whitespace-nowrap">${svg}</span>`;
              }
            });
          }
        });

        html += `<div class="rb w-full flex flex-wrap content-start items-baseline leading-[34px]">${innerHtml}</div>`;

      } else if (b.t === 'bm') {
        html += `<div class="rb rm text-center py-2 overflow-x-hidden w-full my-[17px]" data-bt="${encodeURIComponent(b.c || '')}"></div>`;
      } else if (b.t === 'hr') {
        html += `<div class="rb h-[34px] flex items-center w-full"><div class="w-full border-t-2 border-dashed border-[#c5d3e8] opacity-60"></div></div>`;
      } else if (b.t === 'e') {
        html += `<div class="rb h-[34px] w-full"></div>`;
      }
    }
    return html;
  };

  const replaceMathJaxPaths = (container: HTMLElement) => {
    if (!fontData.ready) return;
    container.querySelectorAll('svg').forEach(s => {
       s.querySelectorAll('path[data-c]').forEach(p => {
          const hex = p.getAttribute('data-c')?.toUpperCase();
          if (!hex) return;
          const glyph = fontData.H[hex];
          if (!glyph?.d) return;
          const S = 1000 / fontData.metrics.em;
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', `scale(${S},${S})`);
          const np = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          np.setAttribute('d', glyph.d);
          np.setAttribute('fill', '#1a1a2e');
          g.appendChild(np);
          p.parentNode?.replaceChild(g, p);
       });
    });
  };

  useEffect(() => {
    const process = async () => {
      if (!measureRef.current) return;
      setIsPaginating(true);

      const blocks = parseDoc(content);
      const fullHtml = generateBlockHtml(blocks);
      measureRef.current.innerHTML = fullHtml;

      const MJ = (window as any).MathJax;
      if (MJ) {
        const inlineMath = measureRef.current.querySelectorAll('[data-it]');
        for (let i = 0; i < inlineMath.length; i++) {
          const el = inlineMath[i];
          const tex = decodeURIComponent(el.getAttribute('data-it') || '');
          try {
            el.innerHTML = ''; 
            const node = await MJ.tex2svgPromise(tex, { display: false });
            el.appendChild(node);
            (el as HTMLElement).style.verticalAlign = 'baseline';
            replaceMathJaxPaths(el as HTMLElement);
          } catch (e) {}
        }
        const blockMath = measureRef.current.querySelectorAll('[data-bt]');
        for (let i = 0; i < blockMath.length; i++) {
          const el = blockMath[i];
          const tex = decodeURIComponent(el.getAttribute('data-bt') || '');
          try {
            el.innerHTML = '';
            const node = await MJ.tex2svgPromise(tex, { display: true });
            el.appendChild(node);
            replaceMathJaxPaths(el as HTMLElement);
          } catch (e) {}
        }
      }

      const newPages: string[] = [];
      let currentPageHtml = '';
      let currentHeight = 0;
      
      const queue = Array.from(measureRef.current.children) as HTMLElement[];
      
      while (queue.length > 0) {
        const child = queue.shift()!;
        if (!child.parentElement) {
            measureRef.current.appendChild(child);
        }

        const h = child.offsetHeight;
        
        if (currentHeight + h <= CONTENT_HEIGHT_PX) {
          currentPageHtml += child.outerHTML;
          currentHeight += h;
        } else {
          const isWrappable = child.classList.contains('flex') && child.children.length > 1;
          
          if (isWrappable) {
            const remainingSpace = CONTENT_HEIGHT_PX - currentHeight;
            const words = Array.from(child.children) as HTMLElement[];
            let splitIndex = -1;
            
            if (remainingSpace < LINE_HEIGHT) {
                splitIndex = 0;
            } else {
                for(let w=0; w<words.length; w++) {
                    const word = words[w];
                    if (word.offsetTop + word.offsetHeight > remainingSpace) {
                        splitIndex = w;
                        break;
                    }
                }
            }

            if (splitIndex > 0 && splitIndex < words.length) {
                const head = child.cloneNode(false) as HTMLElement;
                head.innerHTML = words.slice(0, splitIndex).map(x => x.outerHTML).join('');
                currentPageHtml += head.outerHTML;
                
                newPages.push(currentPageHtml);
                currentPageHtml = '';
                currentHeight = 0;
                
                const tail = child.cloneNode(false) as HTMLElement;
                tail.innerHTML = words.slice(splitIndex).map(x => x.outerHTML).join('');
                queue.unshift(tail); 
                continue;
            } else {
                if (currentHeight > 0) {
                    newPages.push(currentPageHtml);
                    currentPageHtml = '';
                    currentHeight = 0;
                    queue.unshift(child); 
                    continue;
                } else {
                    currentPageHtml += child.outerHTML;
                    currentHeight += h;
                }
            }
          } else {
            if (currentHeight > 0) {
                newPages.push(currentPageHtml);
                currentPageHtml = '';
                currentHeight = 0;
                queue.unshift(child); 
                continue;
            } else {
                currentPageHtml += child.outerHTML;
                currentHeight += h;
            }
          }
        }
      }
      
      if (currentPageHtml) newPages.push(currentPageHtml);
      if (newPages.length === 0) newPages.push('');

      setPages(newPages);
      setIsPaginating(false);
    };

    process();
  }, [content, fontData]);

  return (
    <div className="flex-1 overflow-auto bg-[#e5e5e5] flex flex-col items-center py-[40px] px-4 print:p-0 print:bg-white print:block">
      
      {/* Hidden Measure Layer */}
      <div 
        ref={measureRef} 
        style={{ 
          width: `${PAGE_WIDTH_MM - (MARGIN_MM * 2)}mm`, 
          position: 'absolute', 
          visibility: 'hidden', 
          top: 0, 
          left: 0,
          padding: 0
        }} 
      />

      {/* Pages Container with Scaling for better visibility on screen */}
      <div className="origin-top transform scale-[1.3] print:transform-none">
        {pages.map((pageHtml, idx) => (
          <div 
            key={idx}
            className="relative shadow-[0_4px_24px_rgba(0,0,0,0.12)] mb-8 last:mb-0 print:shadow-none print:mb-0 print:break-after-page box-border overflow-hidden"
            style={{
              width: `${PAGE_WIDTH_MM}mm`,
              height: `${PAGE_HEIGHT_MM}mm`,
              backgroundImage: "url('https://i.imgur.com/7Z2l31H.png')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'white'
            }}
          >
            {/* Lined Background Overlay - confined to content area */}
            <div 
               className="absolute left-0 w-full pointer-events-none opacity-60"
               style={{
                  top: `${MARGIN_TOP_PX}px`,
                  height: `${CONTENT_HEIGHT_PX}px`, 
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 33px, #c5d3e8 33px, #c5d3e8 34px)',
                  backgroundSize: '100% 100%'
               }}
            />

            {/* Red Margin Line */}
            <div className="absolute top-0 left-[25.4mm] w-[2px] h-full bg-[rgba(210,80,80,0.3)] pointer-events-none z-[1]" />
            
            {/* Content Container */}
            <div 
              className="absolute z-[2] font-handwritten"
              style={{
                  top: `${MARGIN_TOP_PX}px`,
                  left: `${MARGIN_MM}mm`,
                  width: `${PAGE_WIDTH_MM - (MARGIN_MM * 2)}mm`,
                  height: `${CONTENT_HEIGHT_PX}px`,
                  paddingTop: `${CONTENT_PADDING_TOP}px`
              }}
              dangerouslySetInnerHTML={{ __html: pageHtml }}
            />
            
            {/* Page Number */}
            <div className="absolute bottom-4 right-6 text-gray-500 text-sm font-sans z-[3] print:hidden">
              {idx + 1} / {pages.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;
