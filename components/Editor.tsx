import React, { forwardRef } from 'react';
import { SquareTerminal, Printer, Download } from 'lucide-react';
import Toolbar from './Toolbar';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  onInsert: (text: string) => void;
  fontStatus: { ready: boolean; error: boolean; message: string; glyphCount: number };
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ value, onChange, onInsert, fontStatus }, ref) => {
  
  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notebook.txt';
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-[46px] flex items-center justify-between px-3 border-b border-[#eee] bg-[#fafafa] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] bg-gradient-to-br from-[#10a37f] to-[#2dd4bf] rounded-[7px] flex items-center justify-center">
            <SquareTerminal className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">MathPro</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button 
            className="w-[30px] h-[30px] bg-transparent rounded-md flex items-center justify-center text-[#888] hover:bg-[#f0f0f0] hover:text-[#333] transition-colors"
            onClick={() => window.print()}
            title="Print / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            className="w-[30px] h-[30px] bg-transparent rounded-md flex items-center justify-center text-[#888] hover:bg-[#f0f0f0] hover:text-[#333] transition-colors"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar onInsert={onInsert} />

      {/* Code Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <textarea
          ref={ref}
          className="flex-1 w-full border-none outline-none resize-none p-3 text-[12.5px] leading-[1.7] text-[#1a1a1a] bg-white font-mono"
          style={{ tabSize: 2, fontFamily: '"SF Mono","Fira Code","Consolas",monospace' }}
          spellCheck={false}
          placeholder="# Heading&#10;Write text...&#10;&#10;$$&#10;\frac{-b \pm \sqrt{b^2-4ac}}{2a}&#10;$$"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 px-2.5 border-t border-[#eee] bg-[#fafafa] flex items-center justify-between text-[10px] text-[#999] shrink-0">
        <div className="flex items-center">
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${fontStatus.error ? 'bg-red-500' : fontStatus.ready ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></span>
          <span>{fontStatus.error ? fontStatus.message : fontStatus.ready ? 'QEKunjarScript ready' : 'Loading font...'}</span>
        </div>
        <div>{fontStatus.glyphCount > 0 ? `${fontStatus.glyphCount} glyphs` : ''}</div>
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;
