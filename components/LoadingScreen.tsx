import React from 'react';
import { SquareTerminal } from 'lucide-react';

interface LoadingScreenProps {
  visible: boolean;
  progress: number;
  status: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible, progress, status }) => {
  if (!visible) return null;

  return (
    <div className={`fixed inset-0 bg-[#0d0d0d] z-[9999] flex flex-col items-center justify-center transition-opacity duration-600 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex items-center gap-2.5 mb-6 opacity-0 translate-y-3 animate-[fu_0.6s_ease_forwards]">
        <div className="w-9 h-9 bg-gradient-to-br from-[#10a37f] to-[#2dd4bf] rounded-lg flex items-center justify-center">
          <SquareTerminal className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tighter">MathPro</span>
      </div>
      
      <div className="w-[200px] h-[3px] bg-white/10 rounded-sm overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-[#10a37f] to-[#2dd4bf] rounded-sm transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-xs text-white/35 animate-[fu_0.5s_0.3s_forwards] opacity-0">
        {status}
      </div>

      <style>{`
        @keyframes fu {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
