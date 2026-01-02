import React, { useState, useRef, useEffect } from 'react';
import { Gem, ChatMessage } from '../types';
import { Send, Bot, User, Plus, Sparkles, X, Terminal, Cpu, ChevronDown, Settings, Edit3 } from 'lucide-react';

interface NeuralChatProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  gems: Gem[];
  activeGemId: string;
  onSelectGem: (id: string) => void;
  onCreateGem: (name: string, instruction: string) => void;
  onUpdateGem: (id: string, name: string, instruction: string) => void;
  isLoading: boolean;
}

const NeuralChat: React.FC<NeuralChatProps> = ({
  messages,
  onSendMessage,
  gems,
  activeGemId,
  onSelectGem,
  onCreateGem,
  onUpdateGem,
  isLoading
}) => {
  const [inputText, setInputText] = useState("");
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form State
  const [gemName, setGemName] = useState("");
  const [gemInstruction, setGemInstruction] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeGem = gems.find(g => g.id === activeGemId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  const openCreateModal = () => {
      setGemName("");
      setGemInstruction("");
      setShowCreateModal(true);
      setIsDropdownOpen(false);
  };

  const openEditModal = () => {
      if (activeGem) {
          setGemName(activeGem.name);
          setGemInstruction(activeGem.instruction || "");
          setShowEditModal(true);
      }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gemName.trim()) {
      onCreateGem(gemName, gemInstruction);
      setShowCreateModal(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (activeGem && gemName.trim()) {
          onUpdateGem(activeGem.id, gemName, gemInstruction);
          setShowEditModal(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
       {/* Toolbar */}
       <div className="flex items-center justify-between p-3 border-b border-[#222] bg-[#0a0a0a] relative z-20">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-[#111] border border-[#333] rounded shadow-[0_0_10px_rgba(0,204,255,0.2)]">
                <Sparkles size={14} className="text-[#00ccff]" />
             </div>
             
             {/* Custom Dropdown */}
             <div className="relative" ref={dropdownRef}>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-0.5">ACTIVE NEURAL GEM</div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-[#111] border border-[#333] hover:border-[#00ccff] text-[#00ccff] px-3 py-1.5 rounded font-rog text-xs transition-all duration-300 min-w-[200px] justify-between group"
                    >
                        <span className="truncate">{activeGem?.name || "Select Gem"}</span>
                        <ChevronDown size={12} className={`text-gray-500 group-hover:text-[#00ccff] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Edit Button for Custom Gems */}
                    {activeGem?.type === 'custom' && (
                        <button 
                            onClick={openEditModal}
                            className="p-1.5 bg-[#111] border border-[#333] text-gray-400 hover:text-[#ff0033] hover:border-[#ff0033] rounded transition-all duration-300"
                            title="Edit Custom Gem Protocol"
                        >
                            <Settings size={14} />
                        </button>
                    )}
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0a] border border-[#333] rounded-lg shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            
                            {/* System Gems */}
                            <div className="px-2 py-1 text-[10px] text-gray-500 font-mono font-bold uppercase">Standard Modules</div>
                            {gems.filter(g => g.type === 'system').map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => {
                                        onSelectGem(g.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono mb-0.5 flex items-center gap-2 transition-colors
                                        ${activeGemId === g.id 
                                            ? 'bg-[#00ccff]/10 text-[#00ccff] border border-[#00ccff]/30' 
                                            : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                                        }
                                    `}
                                >
                                    <Cpu size={12} className={activeGemId === g.id ? "text-[#00ccff]" : "text-gray-600"} />
                                    {g.name}
                                </button>
                            ))}

                            <div className="h-px bg-[#222] my-1"></div>

                            {/* Custom Gems */}
                            <div className="px-2 py-1 text-[10px] text-gray-500 font-mono font-bold uppercase">Custom Uplinks</div>
                            {gems.filter(g => g.type === 'custom').map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => {
                                        onSelectGem(g.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono mb-0.5 flex items-center gap-2 transition-colors
                                        ${activeGemId === g.id 
                                            ? 'bg-[#ff0033]/10 text-[#ff0033] border border-[#ff0033]/30' 
                                            : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                                        }
                                    `}
                                >
                                    <Sparkles size={12} className={activeGemId === g.id ? "text-[#ff0033]" : "text-gray-600"} />
                                    {g.name}
                                </button>
                            ))}

                            <div className="h-px bg-[#222] my-1"></div>

                            {/* Create New */}
                            <button
                                onClick={openCreateModal}
                                className="w-full text-left px-3 py-2 rounded text-xs font-rog text-[#00ccff] hover:bg-[#00ccff]/10 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Plus size={12} />
                                CREATE CUSTOM GEM...
                            </button>
                        </div>
                    </div>
                )}
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
             <span className="text-[10px] font-mono text-gray-500">{isLoading ? 'PROCESSING' : 'ONLINE'}</span>
          </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#00ccff] blur-xl opacity-20 rounded-full"></div>
                    <Cpu size={64} className="text-[#00ccff] relative z-10" />
                </div>
                <div className="text-center max-w-sm">
                    <h3 className="font-rog text-xl text-white mb-2">NEURAL UPLINK READY</h3>
                    <div className="bg-[#111] border border-[#333] p-3 rounded mb-4">
                        <p className="font-mono text-xs text-[#00ccff] mb-1">CONNECTED TO: {activeGem?.name}</p>
                        <p className="font-mono text-[10px] text-gray-400 line-clamp-3 italic">
                            {activeGem?.instruction || "System Default Protocol"}
                        </p>
                    </div>
                    {activeGem?.type === 'custom' && (
                        <p className="text-[10px] font-mono text-gray-500">
                            * Tip: Click the <Settings size={10} className="inline" /> icon above to paste your exact custom Gem instructions.
                        </p>
                    )}
                </div>
             </div>
          )}
          
          {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`
                    w-8 h-8 rounded flex items-center justify-center shrink-0 border
                    ${msg.role === 'user' 
                        ? 'bg-[#111] border-[#333] text-gray-400' 
                        : 'bg-[#00ccff]/10 border-[#00ccff] text-[#00ccff]'
                    }
                `}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`
                    max-w-[80%] p-3 rounded text-sm font-mono leading-relaxed border
                    ${msg.role === 'user'
                        ? 'bg-[#111] border-[#222] text-gray-300'
                        : 'bg-[#00ccff]/5 border-[#00ccff]/30 text-[#e0e0e0]'
                    }
                `}>
                    {msg.text}
                </div>
             </div>
          ))}
          <div ref={messagesEndRef} />
       </div>

       {/* Input Area */}
       <div className="p-4 border-t border-[#222] bg-[#0a0a0a] relative z-10">
          <form onSubmit={handleSubmit} className="flex gap-2">
             <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`MESSAGE ${activeGem?.name.toUpperCase()}...`}
                disabled={isLoading}
                className="flex-1 bg-[#050505] border border-[#333] text-white font-mono text-sm px-4 py-3 rounded focus:border-[#00ccff] focus:outline-none focus:ring-1 focus:ring-[#00ccff] placeholder-gray-600 disabled:opacity-50"
             />
             <button 
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-[#00ccff]/10 border border-[#00ccff] text-[#00ccff] px-4 py-2 rounded hover:bg-[#00ccff] hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Send size={18} />
             </button>
          </form>
       </div>

       {/* Create/Edit Modal */}
       {(showCreateModal || showEditModal) && (
         <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-[#333] rounded-lg p-6 relative shadow-2xl shadow-[#ff0033]/10">
                <button 
                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>
                
                <h3 className="font-rog text-xl text-white mb-6 flex items-center gap-2">
                    {showEditModal ? <Settings size={20} className="text-[#ff0033]" /> : <Plus size={20} className="text-[#00ccff]" />}
                    {showEditModal ? "CONFIGURE PROTOCOL" : "CREATE CUSTOM GEM"}
                </h3>

                <form onSubmit={showEditModal ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">GEM DESIGNATION (NAME)</label>
                        <input 
                            type="text"
                            value={gemName}
                            onChange={(e) => setGemName(e.target.value)}
                            placeholder="e.g. Kai, Python Specialist..."
                            className="w-full bg-[#050505] border border-[#333] text-white p-2 text-sm font-mono rounded focus:border-[#00ccff] focus:outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">SYSTEM INSTRUCTION (CORE DIRECTIVE)</label>
                        <div className="text-[10px] text-[#ff0033] mb-1 font-mono italic">
                             * Paste your custom Gemini instructions here to sync behavior.
                        </div>
                        <textarea 
                            value={gemInstruction}
                            onChange={(e) => setGemInstruction(e.target.value)}
                            placeholder="Example: You are Kai, a witty and helpful assistant..."
                            className="w-full h-48 bg-[#050505] border border-[#333] text-gray-300 p-3 text-xs font-mono rounded focus:border-[#00ccff] focus:outline-none resize-none leading-relaxed custom-scrollbar"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!gemName.trim()}
                        className={`w-full py-3 rounded transition-all duration-300 font-rog text-sm disabled:opacity-50
                            ${showEditModal 
                                ? 'bg-[#ff0033]/10 border border-[#ff0033] text-[#ff0033] hover:bg-[#ff0033] hover:text-white' 
                                : 'bg-[#00ccff]/10 border border-[#00ccff] text-[#00ccff] hover:bg-[#00ccff] hover:text-black'
                            }
                        `}
                    >
                        {showEditModal ? "UPDATE PROTOCOL" : "INITIALIZE GEM"}
                    </button>
                </form>
            </div>
         </div>
       )}

       {/* Decor */}
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ccff] to-transparent opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default NeuralChat;