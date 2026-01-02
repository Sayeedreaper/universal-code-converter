import React, { ReactNode } from 'react';
import { Cpu, Zap, Activity } from 'lucide-react';

interface ROGLayoutProps {
  children: ReactNode;
}

const ROGLayout: React.FC<ROGLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#ff0033] selection:text-white flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0033] via-[#00ccff] to-[#9d00ff] opacity-50"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#ff0033] rounded-full filter blur-[100px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#00ccff] rounded-full filter blur-[120px] opacity-10"></div>
        
        {/* Grid Lines */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-[#ff0033] to-[#9d00ff] rounded-lg blur opacity-75"></div>
             <div className="relative bg-black p-2 rounded-lg border border-[#333]">
                <Cpu className="w-8 h-8 text-[#ff0033]" />
             </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-rog tracking-widest text-white uppercase">
              ROG <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0033] to-[#00ccff]">Universal</span>
            </h1>
            <p className="text-xs font-mono text-gray-500 tracking-[0.3em] uppercase">Hybrid Converter // Z1 Extreme Engine</p>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-1 bg-[#111] border border-gray-800 clip-rog-top rounded-sm">
             <Zap className="w-4 h-4 text-[#00ccff]" />
             <span className="text-xs font-mono text-[#00ccff]">SYSTEM: ONLINE</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-1 bg-[#111] border border-gray-800 clip-rog-top rounded-sm">
             <Activity className="w-4 h-4 text-[#ff0033]" />
             <span className="text-xs font-mono text-[#ff0033]">PERFORMANCE: MAX</span>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mt-12 pt-6 border-t border-gray-800 flex justify-between items-center text-xs text-gray-600 font-mono">
         <div>ASUS ROG THEME INSPIRED INTERFACE</div>
         <div>V.3.1.0 // PWA HYBRID CORE</div>
      </footer>
    </div>
  );
};

export default ROGLayout;