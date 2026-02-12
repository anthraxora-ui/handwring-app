import React from 'react';

interface ToolbarProps {
  onInsert: (text: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onInsert }) => {
  const btnClass = "w-7 h-[26px] bg-transparent border-none rounded hover:bg-[#e8e8e8] text-[#666] hover:text-[#1a1a1a] flex items-center justify-center text-sm font-semibold transition-all duration-100 cursor-pointer select-none font-inherit";
  const sepClass = "w-px h-4 bg-[#e0e0e0] mx-[3px]";

  return (
    <div className="flex items-center gap-[1px] px-2 py-1 border-b border-[#eee] bg-[#fafafa] flex-wrap shrink-0">
      <button className={btnClass} onClick={() => onInsert('# ')} style={{ fontFamily: 'serif', fontWeight: 800 }}>H</button>
      <button className={btnClass} onClick={() => onInsert('## ')} style={{ fontFamily: 'serif', fontSize: '11px' }}>H₂</button>
      <span className={sepClass}></span>
      <button className={btnClass} onClick={() => onInsert('$$\n\\frac{a}{b}\n$$')}>∑</button>
      <button className={btnClass} onClick={() => onInsert('$x^2$')} style={{ fontSize: '12px' }}>x²</button>
      <span className={sepClass}></span>
      <button className={btnClass} onClick={() => onInsert('\\int_{a}^{b} f(x)\\,dx')}>∫</button>
      <button className={btnClass} onClick={() => onInsert('\\frac{}{}')} style={{ fontSize: '11px' }}>ᵃ⁄ᵦ</button>
      <button className={btnClass} onClick={() => onInsert('\\sqrt{}')}>√</button>
      <button className={btnClass} onClick={() => onInsert('\\sum_{i=1}^{n}')} style={{ fontSize: '13px' }}>Σ</button>
      <span className={sepClass}></span>
      <button className={btnClass} onClick={() => onInsert('---')}>―</button>
    </div>
  );
};

export default Toolbar;
