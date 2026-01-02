import React, { useState } from 'react';
import { TabOption, Gem, ChatMessage } from '../types';
import { FileCode, Binary, Cpu, Copy, Download, Terminal, Play, MessageSquare } from 'lucide-react';
import NeuralChat from './NeuralChat';

interface DataViewerProps {
  activeTab: TabOption;
  setActiveTab: (tab: TabOption) => void;
  binaryContent: string;
  pythonRawContent: string;
  pythonSmartContent: string;
  isAiLoading: boolean;
  onAiCommand: (instruction: string) => void;
  // Chat Props
  chatMessages?: ChatMessage[];
  onChatSend?: (msg: string) => void;
  gems?: Gem[];
  activeGemId?: string;
  onSelectGem?: (id: string) => void;
  onCreateGem?: (name: string, instruction: string) => void;
  onUpdateGem?: (id: string, name: string, instruction: string) => void;
  isChatLoading?: boolean;
}

const DataViewer: React.FC<DataViewerProps> = ({
  activeTab,
  setActiveTab,
  binaryContent,
  pythonRawContent,
  pythonSmartContent,
  isAiLoading,
  onAiCommand,
  chatMessages = [],
  onChatSend = () => {},
  gems = [],
  activeGemId = '',
  onSelectGem = () => {},
  onCreateGem = () => {},
  onUpdateGem = () => {},
  isChatLoading = false
}) => {
  const [command, setCommand] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadContent = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
        onAiCommand(command);
    }
  };

  const getActiveContent = () => {
    switch(activeTab) {
      case TabOption.BINARY: return binaryContent;
      case TabOption.PYTHON_RAW: return pythonRawContent;
      case TabOption.PYTHON_SMART: return pythonSmartContent;
      default: return '';
    }
  };

  const getActiveFilename = () => {
    switch(activeTab) {
        case TabOption.BINARY: return 'dump.bin';
        case TabOption.PYTHON_RAW: return 'raw_loader.py';
        case TabOption.PYTHON_SMART: return 'smart_script.py';
        default: return 'data.txt';
    }
  }

  const renderTabButton = (tab: TabOption, label: string, icon: React.ReactNode, colorClass: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`
          relative flex items-center gap-2 px-6 py-3 font-rog text-sm tracking-wider uppercase
          transition-all duration-300 clip-rog-top
          ${isActive 
            ? `bg-[#1a1a1a] text-white border-b-2 ${colorClass}` 
            : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111]'
          }
        `}
      >
        <span className={`${isActive ? colorClass.replace('border-', 'text-') : ''}`}>{icon}</span>
        {label}
        {isActive && (
           <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${colorClass.replace('border-', '')} to-transparent opacity-50`}></div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full bg-[#080808] border border-[#222] rounded-lg overflow-hidden shadow-2xl relative flex flex-col h-[600px]">
       {/* Ambient Glow */}
       <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent 
         ${activeTab === TabOption.BINARY ? 'via-[#00ccff]' : 
           activeTab === TabOption.PYTHON_RAW ? 'via-[#ff0033]' : 
           activeTab === TabOption.GEMINI_CHAT ? 'via-green-500' : 'via-[#9d00ff]'} 
         to-transparent shadow-[0_0_20px_currentColor] opacity-50 transition-colors duration-500`}></div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#222] bg-[#0c0c0c] shrink-0">
        {renderTabButton(TabOption.BINARY, 'Binary Core', <Binary size={16} />, 'border-[#00ccff]')}
        {renderTabButton(TabOption.PYTHON_RAW, 'Python Raw', <FileCode size={16} />, 'border-[#ff0033]')}
        {renderTabButton(TabOption.PYTHON_SMART, 'AI Neural Script', <Cpu size={16} />, 'border-[#9d00ff]')}
        {renderTabButton(TabOption.GEMINI_CHAT, 'Neural Uplink', <MessageSquare size={16} />, 'border-green-500')}
      </div>

      {/* RENDER CHAT OR FILE VIEWER */}
      {activeTab === TabOption.GEMINI_CHAT ? (
        <NeuralChat 
            messages={chatMessages}
            onSendMessage={onChatSend}
            gems={gems}
            activeGemId={activeGemId}
            onSelectGem={onSelectGem}
            onCreateGem={onCreateGem}
            onUpdateGem={onUpdateGem}
            isLoading={isChatLoading}
        />
      ) : (
          <>
            {/* Neural Command Bar (Only for Smart Script) */}
            {activeTab === TabOption.PYTHON_SMART && (
                <div className="bg-[#111] border-b border-[#333] p-4 shrink-0">
                    <form onSubmit={handleCommandSubmit} className="flex gap-2 w-full">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Terminal size={14} className="text-[#9d00ff]" />
                            </div>
                            <input 
                                type="text" 
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                placeholder="ENTER COMMAND: e.g., 'Convert to CSV', 'Find max value', 'Extract headers'..." 
                                className="w-full bg-[#050505] border border-[#333] text-gray-200 text-sm font-mono rounded pl-10 pr-4 py-2 focus:outline-none focus:border-[#9d00ff] focus:ring-1 focus:ring-[#9d00ff] placeholder-gray-600"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isAiLoading || !command.trim()}
                            className={`
                                px-6 py-2 bg-[#9d00ff]/10 border border-[#9d00ff] text-[#9d00ff] font-rog text-xs tracking-wider rounded
                                hover:bg-[#9d00ff] hover:text-white transition-all duration-300
                                flex items-center gap-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            <Play size={12} fill="currentColor" />
                            EXECUTE
                        </button>
                    </form>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between items-center px-4 py-2 bg-[#0a0a0a] border-b border-[#222] shrink-0">
                <div className="text-xs font-mono text-gray-500">
                {activeTab === TabOption.PYTHON_SMART && isAiLoading ? 'NEURAL ENGINE PROCESSING...' : `${getActiveContent().length} CHARACTERS RENDERED`}
                </div>
                <div className="flex gap-2">
                <button 
                    onClick={() => copyToClipboard(getActiveContent())}
                    className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"
                    title="Copy to Clipboard"
                >
                    <Copy size={14} />
                </button>
                <button 
                    onClick={() => downloadContent(getActiveContent(), getActiveFilename())}
                    className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"
                    title="Download File"
                >
                    <Download size={14} />
                </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-hidden bg-[#050505]">
                {activeTab === TabOption.PYTHON_SMART && isAiLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#050505]/90 backdrop-blur-sm z-20">
                    <div className="w-16 h-16 border-4 border-t-[#9d00ff] border-r-[#9d00ff]/30 border-b-[#9d00ff]/10 border-l-[#9d00ff]/30 rounded-full animate-spin"></div>
                    <p className="font-rog text-[#9d00ff] animate-pulse">GENERATING LOGIC</p>
                    <p className="font-mono text-xs text-gray-600">Analyzing file signature & synthesizing Python code...</p>
                </div>
                ) : null}
                
                <div className="absolute inset-0 overflow-auto custom-scrollbar p-4">
                    <pre className="font-mono text-sm leading-relaxed">
                    <code className={
                        activeTab === TabOption.BINARY ? 'text-[#00ccff]' : 
                        activeTab === TabOption.PYTHON_RAW ? 'text-[#ff0033]' : 'text-[#d0a6ff]'
                    }>
                        {getActiveContent() || "NO DATA LOADED. PLEASE UPLOAD A FILE."}
                    </code>
                    </pre>
                </div>

                {/* Decor Lines in Editor */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#111] pointer-events-none"></div>
                <div className="absolute top-0 left-8 w-[1px] h-full bg-[#222] pointer-events-none"></div>
            </div>
          </>
      )}
    </div>
  );
};

export default DataViewer;