import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_TEXT, FONT_URL } from './constants';
import { FontData } from './types';
import { parseFontData } from './services/fontService';
import LoadingScreen from './components/LoadingScreen';
import Editor from './components/Editor';
import Preview from './components/Preview';

const App: React.FC = () => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem('mathpro-src') || DEFAULT_TEXT;
  });
  
  const [fontData, setFontData] = useState<FontData>({
    G: {},
    H: {},
    metrics: { em: 1000, asc: 800, desc: -200, fam: '' },
    ready: false
  });
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [fontError, setFontError] = useState('');

  // Editor resize state
  const [editorWidth, setEditorWidth] = useState(420);
  const isResizing = useRef(false);

  // Debounce logic for content updates to preview
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(content);
      localStorage.setItem('mathpro-src', content);
    }, 500);
    return () => clearTimeout(handler);
  }, [content]);

  // Initial Load
  useEffect(() => {
    const loadResources = async () => {
      setProgress(10);
      setStatus('Loading MathJax...');
      
      // Wait for MathJax
      if (!(window as any).MJ_READY) {
         // Fallback if event missed or not yet fired
         // We'll proceed to font loading in parallel mostly, but let's delay slightly
         await new Promise(r => setTimeout(r, 500));
      }

      try {
        setProgress(20);
        setStatus('Fetching QEKunjarScript (~9.5 MB)...');
        
        const response = await fetch(FONT_URL);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        setProgress(55);
        setStatus('Downloading...');
        const svgText = await response.text();
        
        setProgress(80);
        setStatus('Parsing 9,500+ glyphs...');
        
        // Yield to UI to show status update before parsing heavy XML
        await new Promise(r => setTimeout(r, 50));
        
        const data = parseFontData(svgText);
        setFontData(data);
        
        setProgress(95);
        setStatus('Ready!');
      } catch (e: any) {
        console.error(e);
        setFontError(e.message);
        setStatus('Font failed');
      }

      setProgress(100);
      setTimeout(() => setLoading(false), 600);
    };

    loadResources();
  }, []);

  // Resizer Logic
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 300), 600);
      setEditorWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleInsert = (text: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newVal = content.substring(0, start) + text + content.substring(end);
      setContent(newVal);
      // Wait for react render cycle then focus
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
      }, 0);
    }
  };

  return (
    <>
      <LoadingScreen visible={loading} progress={progress} status={status} />
      
      <div className="flex h-screen w-screen flex-col md:flex-row overflow-hidden">
        {/* Editor Pane */}
        <div 
          className="flex flex-col bg-white border-r border-[#e5e5e5] shrink-0 relative md:h-full h-[45vh] w-full md:w-auto md:border-b-0 border-b"
          style={{ width: window.innerWidth >= 768 ? editorWidth : '100%' }}
        >
          <Editor 
            value={content} 
            onChange={setContent} 
            onInsert={handleInsert}
            fontStatus={{
              ready: fontData.ready,
              error: !!fontError,
              message: fontError,
              glyphCount: Object.keys(fontData.G).length
            }}
          />
          
          {/* Resizer Handle */}
          <div 
            className="absolute -right-[3px] top-0 w-[6px] h-full cursor-col-resize z-50 hover:bg-[#10a37f]/15 hidden md:block"
            onMouseDown={startResize}
          />
        </div>

        {/* Preview Pane */}
        <Preview content={debouncedContent} fontData={fontData} />
      </div>
    </>
  );
};

export default App;
