import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  timestamp: string;
}

interface SystemTerminalProps {
  logs: LogEntry[];
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full h-64 bg-[#080808] border border-[#222] rounded-lg p-4 relative overflow-hidden flex flex-col font-mono text-xs shadow-inner shadow-black group">
       {/* Header */}
       <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-2 shrink-0 z-10 bg-[#080808]">
          <div className="flex items-center gap-2 text-gray-500 group-hover:text-[#00ccff] transition-colors">
             <TerminalIcon size={12} />
             <span>SYSTEM_LOG // TERMINAL_OUTPUT</span>
          </div>
          <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-[#ff0033] animate-pulse"></div>
             <div className="w-2 h-2 rounded-full bg-[#00ccff]"></div>
          </div>
       </div>

       {/* Logs */}
       <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-1 font-mono leading-tight">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
               <span className="text-gray-700 shrink-0">[{log.timestamp}]</span>
               <span className={`${
                 log.type === 'error' ? 'text-red-500 font-bold' : 
                 log.type === 'success' ? 'text-[#00ccff]' : 
                 log.type === 'warning' ? 'text-yellow-500' :
                 log.type === 'system' ? 'text-[#ff0033]' : 'text-gray-400'
               }`}>
                 {log.type === 'system' ? '> ' : ''}{log.text}
               </span>
            </div>
          ))}
          <div ref={bottomRef} />
       </div>

       {/* CRT/Scanline Effect */}
       <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20"></div>
       
       {/* Optional Grid Background */}
       <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ 
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '20px 20px'
       }}></div>
    </div>
  );
};

export default SystemTerminal;