import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Package, Code2, ExternalLink, Wifi, Terminal, Key, Copy, Check, ChevronRight, Zap } from 'lucide-react';

interface SystemExportProps {
  onSyncKey: (key: string) => void;
}

// --- SOURCE CODE REPOSITORY ---
const TYPE_DEFS = `export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  hexPreview: string; // First N bytes
  binaryString: string; // First N bytes
}

export enum TabOption {
  BINARY = 'BINARY',
  PYTHON_RAW = 'PYTHON_RAW',
  PYTHON_SMART = 'PYTHON_SMART'
}

export interface AnalysisState {
  loading: boolean;
  content: string | null;
  error: string | null;
}`;

const UTILS_FILE = `export const bufferToHex = (buffer: ArrayBuffer, limit: number = 512): string => {
  const bytes = new Uint8Array(buffer);
  const length = Math.min(bytes.length, limit);
  let hex = '';
  for (let i = 0; i < length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0').toUpperCase() + ' ';
  }
  return hex.trim();
};

export const bufferToBinaryString = (buffer: ArrayBuffer, limit: number = 256): string => {
  const bytes = new Uint8Array(buffer);
  const length = Math.min(bytes.length, limit);
  let binary = '';
  for (let i = 0; i < length; i++) {
    binary += bytes[i].toString(2).padStart(8, '0') + ' ';
  }
  return binary.trim();
};

export const bufferToPythonBytes = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  // Limit for display performance
  const limit = 2000; 
  const isTruncated = bytes.length > limit;
  const processBytes = isTruncated ? bytes.slice(0, limit) : bytes;
  
  let pythonStr = "file_data = b'";
  for (let i = 0; i < processBytes.length; i++) {
    pythonStr += "\\\\x" + processBytes[i].toString(16).padStart(2, '0');
  }
  pythonStr += "'";
  
  if (isTruncated) {
    pythonStr += \`\\n# ... truncated (showing \${limit} of \${bytes.length} bytes)\`;
  }
  
  return pythonStr;
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} \${sizes[i]}\`;
};`;

const GEMINI_SERVICE = `import { GoogleGenAI } from "@google/genai";

const getClient = (overrideKey?: string) => {
  const apiKey = overrideKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSmartPythonScript = async (
  fileName: string,
  fileType: string,
  filePreview: string,
  userInstruction?: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    
    // Using flash for speed and reasoning
    const model = "gemini-3-flash-preview";

    let prompt = "";

    if (userInstruction) {
      // User has a specific request
      prompt = \`
        I have a file named "\${fileName}" with MIME type "\${fileType}".
        
        Here is a hex preview of the beginning of the file (first few bytes):
        \${filePreview}
        
        THE USER HAS A SPECIFIC GOAL:
        "\${userInstruction}"
        
        Please write a COMPLETE, ROBUST, and PROFESSIONAL Python script to accomplish this specific goal.
        - Assume the file is in the local directory.
        - Use standard libraries or popular ones (pandas, numpy, PIL, etc.).
        - Handle potential errors gracefully.
        - Add comments explaining complex parts.
        
        Return ONLY the Python code block. Do not use Markdown backticks.
      \`;
    } else {
      // Default generic analysis
      prompt = \`
        I have a file named "\${fileName}" with MIME type "\${fileType}".
        
        Here is a hex preview of the beginning of the file:
        \${filePreview}
        
        Please write a robust, professional Python script to:
        1. Load this file efficiently.
        2. Identify what library would be best to parse it based on the file type/magic bytes.
        3. Provide a code snippet that opens the file and prints basic metadata or statistics about it.
        
        If the file type is generic binary, use the 'struct' module.
        Return ONLY the Python code block. Do not use Markdown backticks.
      \`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text || "";
    // Clean up if the model adds markdown
    return text.replace(/\`\`\`python/g, '').replace(/\`\`\`/g, '').trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return \`# Error generating smart script.\\n# Please check your API configuration.\\n# Details: \${error instanceof Error ? error.message : String(error)}\`;
  }
};

export const generateTeamSuccessVideo = async (
    imageBase64: string,
    mimeType: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = getClient(apiKey);
        const model = 'veo-3.1-fast-generate-preview';
        
        const prompt = "Cyberpunk style, cinematic 8k. A futuristic command center with red and blue neon lighting (ROG Aura style). In the center, a highly detailed character resembling the input image is typing on a holographic keyboard. Standing next to them is a glowing, abstract digital spirit made of pure data (representing the AI Assistant). They look at a massive main screen showing 'SUCCESS' and complex code scrolling. They high-five or nod in mutual respect. Digital confetti and sparks. High energy, triumphant atmosphere.";

        console.log("Initiating Veo Video Generation...");

        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        console.log("Video operation started. Polling for completion...");

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log("Polling status...", operation.metadata);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            throw new Error("Video generation completed but no URI returned.");
        }

        const currentKey = apiKey || process.env.API_KEY;
        return \`\${downloadLink}&key=\${currentKey}\`;

    } catch (error) {
        console.error("Veo API Error:", error);
        throw error;
    }
};`;

const ROG_LAYOUT = `import React, { ReactNode } from 'react';
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

export default ROGLayout;`;

const FILE_UPLOAD = `import React, { useRef, useState } from 'react';
import { Upload, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/fileUtils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    onFileSelect(file);
  };

  return (
    <div className="w-full mb-8">
      <div 
        className={\`
          relative group cursor-pointer
          bg-[#0a0a0a] border-2 border-dashed 
          \${isDragging ? 'border-[#00ccff] bg-[#00ccff]/5' : 'border-[#333] hover:border-[#ff0033] hover:bg-[#ff0033]/5'}
          transition-all duration-300 ease-out
          clip-rog rounded-lg p-10
          flex flex-col items-center justify-center
          min-h-[200px]
        \`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleInputChange} 
          className="hidden" 
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {fileName ? (
             <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00ccff] to-[#9d00ff] flex items-center justify-center mb-4 shadow-lg shadow-[#00ccff]/20">
                  <CheckCircle className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-rog text-white mb-2">{fileName}</h3>
                <p className="text-[#00ccff] font-mono">{fileSize}</p>
                <p className="mt-4 text-xs text-gray-500 font-mono uppercase tracking-widest">Click to change file</p>
             </>
          ) : (
            <>
              <div className={\`
                w-16 h-16 rounded-full bg-[#111] border border-[#333] 
                flex items-center justify-center mb-4 
                group-hover:scale-110 group-hover:border-[#ff0033] group-hover:shadow-[0_0_15px_rgba(255,0,51,0.5)]
                transition-all duration-300
              \`}>
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#ff0033] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 group-hover:text-white font-rog mb-2">
                INITIATE DATA UPLOAD
              </h3>
              <p className="text-gray-500 font-mono text-sm">
                DRAG & DROP OR CLICK TO SELECT FILE
              </p>
              <div className="mt-6 flex gap-2">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded text-[10px] text-gray-500 border border-[#333]">ANY FORMAT</span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded text-[10px] text-gray-500 border border-[#333]">AUTO-DETECT</span>
              </div>
            </>
          )}
        </div>

        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-transparent group-hover:border-[#ff0033] transition-all duration-500"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-[#00ccff] transition-all duration-500"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-[#9d00ff] transition-all duration-500"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-transparent group-hover:border-white transition-all duration-500"></div>
      </div>
    </div>
  );
};

export default FileUpload;`;

const DATA_VIEWER = `import React, { useState } from 'react';
import { TabOption } from '../types';
import { FileCode, Binary, Cpu, Copy, Download, Terminal, Play } from 'lucide-react';

interface DataViewerProps {
  activeTab: TabOption;
  setActiveTab: (tab: TabOption) => void;
  binaryContent: string;
  pythonRawContent: string;
  pythonSmartContent: string;
  isAiLoading: boolean;
  onAiCommand: (instruction: string) => void;
}

const DataViewer: React.FC<DataViewerProps> = ({
  activeTab,
  setActiveTab,
  binaryContent,
  pythonRawContent,
  pythonSmartContent,
  isAiLoading,
  onAiCommand
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
        className={\`
          relative flex items-center gap-2 px-6 py-3 font-rog text-sm tracking-wider uppercase
          transition-all duration-300 clip-rog-top
          \${isActive 
            ? \`bg-[#1a1a1a] text-white border-b-2 \${colorClass}\` 
            : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111]'
          }
        \`}
      >
        <span className={\`\${isActive ? colorClass.replace('border-', 'text-') : ''}\`}>{icon}</span>
        {label}
        {isActive && (
           <div className={\`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-\${colorClass.replace('border-', '')} to-transparent opacity-50\`}></div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full bg-[#080808] border border-[#222] rounded-lg overflow-hidden shadow-2xl relative flex flex-col h-[600px]">
       {/* Ambient Glow */}
       <div className={\`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent 
         \${activeTab === TabOption.BINARY ? 'via-[#00ccff]' : activeTab === TabOption.PYTHON_RAW ? 'via-[#ff0033]' : 'via-[#9d00ff]'} 
         to-transparent shadow-[0_0_20px_currentColor] opacity-50 transition-colors duration-500\`}></div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#222] bg-[#0c0c0c] shrink-0">
        {renderTabButton(TabOption.BINARY, 'Binary Core', <Binary size={16} />, 'border-[#00ccff]')}
        {renderTabButton(TabOption.PYTHON_RAW, 'Python Raw', <FileCode size={16} />, 'border-[#ff0033]')}
        {renderTabButton(TabOption.PYTHON_SMART, 'AI Neural Script', <Cpu size={16} />, 'border-[#9d00ff]')}
      </div>

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
                    className={\`
                        px-6 py-2 bg-[#9d00ff]/10 border border-[#9d00ff] text-[#9d00ff] font-rog text-xs tracking-wider rounded
                        hover:bg-[#9d00ff] hover:text-white transition-all duration-300
                        flex items-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                    \`}
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
          {activeTab === TabOption.PYTHON_SMART && isAiLoading ? 'NEURAL ENGINE PROCESSING...' : \`\${getActiveContent().length} CHARACTERS RENDERED\`}
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
    </div>
  );
};

export default DataViewer;`;

const APP_FILE = `import React, { useState, useEffect } from 'react';
import ROGLayout from './components/ROGLayout';
import FileUpload from './components/FileUpload';
import DataViewer from './components/DataViewer';
import SystemExport from './components/SystemExport';
import SystemTerminal, { LogEntry } from './components/SystemTerminal';
import SuccessVisualizer from './components/SuccessVisualizer';
import { ProcessedFile, TabOption } from './types';
import { bufferToHex, bufferToPythonBytes, bufferToBinaryString } from './utils/fileUtils';
import { generateSmartPythonScript } from './services/geminiService';

const App: React.FC = () => {
  const [fileData, setFileData] = useState<ProcessedFile | null>(null);
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.BINARY);
  const [smartScript, setSmartScript] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>("");

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    }]);
  };

  useEffect(() => {
    const bootSequence = [
      { text: 'SYSTEM_BOOT_SEQUENCE_INITIATED', delay: 100, type: 'system' },
      { text: 'LOADING_Z1_EXTREME_ENGINE_MODULES...', delay: 400, type: 'system' },
      { text: 'CHECKING_ENV_VARIABLES...', delay: 800, type: 'info' },
      { text: 'MOUNTING_VIRTUAL_FILE_SYSTEM...', delay: 1200, type: 'info' },
      { text: 'SYSTEM_READY. WAITING_FOR_INPUT.', delay: 1600, type: 'success' },
    ];
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    bootSequence.forEach(({ text, delay, type }) => {
      const timeout = setTimeout(() => {
        addLog(text, type as LogEntry['type']);
      }, delay);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleSyncKey = (key: string) => {
    if (key.trim()) {
        setCustomApiKey(key.trim());
        addLog('SECURE_UPLINK_ESTABLISHED: CUSTOM_KEY_ACTIVE', 'success');
        addLog('SYSTEM_OVERRIDE: ENVIRONMENT_VARIABLES_UPDATED', 'warning');
    } else {
        addLog('ERROR: INVALID_KEY_INPUT', 'error');
    }
  };

  const handleFileSelect = async (file: File) => {
    setSmartScript(""); 
    addLog(\`INITIATING_UPLOAD: \${file.name}\`, 'system');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        addLog(\`BUFFER_READ_SUCCESS: \${arrayBuffer.byteLength} bytes\`, 'success');
        
        const hexPreview = bufferToHex(arrayBuffer);
        const binaryStr = bufferToBinaryString(arrayBuffer);
        
        setFileData({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          arrayBuffer,
          hexPreview,
          binaryString: binaryStr
        });

        setActiveTab(TabOption.BINARY);
        addLog(\`MODULES_ENGAGED: HEX_VIEWER, BINARY_DECODER\`, 'info');

        addLog(\`CONTACTING_NEURAL_CORE (Gemini-3-Flash)...\`, 'warning');
        await runAiAnalysis(file.name, file.type || 'unknown', hexPreview);
    } catch (err) {
        addLog(\`ERROR_PROCESSING_FILE: \${err}\`, 'error');
    }
  };

  const runAiAnalysis = async (name: string, type: string, hex: string, instruction?: string) => {
    setIsAiLoading(true);
    try {
      if (instruction) addLog(\`USER_COMMAND_RECEIVED: "\${instruction}"\`, 'system');
      // Pass customApiKey if set
      const script = await generateSmartPythonScript(name, type, hex, instruction, customApiKey || undefined);
      setSmartScript(script);
      addLog(\`NEURAL_GENERATION_COMPLETE: PYTHON_SCRIPT_READY\`, 'success');
      if (instruction) {
        setActiveTab(TabOption.PYTHON_SMART);
        addLog(\`INTERFACE_SWITCH: SMART_TAB\`, 'info');
      }
    } catch (e) {
      console.error(e);
      setSmartScript("# Error generating AI script.");
      addLog(\`NEURAL_CORE_FAILURE: API_CONNECTION_ERROR\`, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiCommand = (instruction: string) => {
    if (!fileData) {
        addLog(\`COMMAND_REJECTED: NO_FILE_LOADED\`, 'error');
        return;
    }
    runAiAnalysis(fileData.name, fileData.type, fileData.hexPreview, instruction);
  };

  const getBinaryDisplay = () => {
    if (!fileData) return "";
    return \`FILE_NAME: \${fileData.name}\\nFILE_SIZE: \${fileData.size} bytes\\nTYPE: \${fileData.type}\\n\\n[HEX DUMP START]\\n\${fileData.hexPreview}\\n\\n[BINARY STREAM START]\\n\${fileData.binaryString}\\n...\`;
  };

  const getPythonRawDisplay = () => {
    if (!fileData) return "";
    return \`# RAW BYTE LOADER FOR: \${fileData.name}\\n# Automatically generated\\n\\n\${bufferToPythonBytes(fileData.arrayBuffer)}\\n\\nprint(f"Loaded {len(file_data)} bytes from raw buffer.")\`;
  };

  return (
    <ROGLayout>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#080808] border border-[#222] p-6 rounded-lg shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#ff0033]/20 to-transparent clip-rog-top"></div>
               <h2 className="text-xl font-rog text-white mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-[#ff0033] rounded-full animate-pulse"></span>
                 INPUT MODULE
               </h2>
               <FileUpload onFileSelect={handleFileSelect} />
               {fileData && (
                 <div className="mt-6 space-y-2 font-mono text-sm text-gray-400">
                    <div className="flex justify-between border-b border-[#222] pb-1">
                      <span>STATUS</span>
                      <span className="text-[#00ccff]">LOADED</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-1">
                      <span>BUFFER</span>
                      <span className="text-white">ACTIVE</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-1">
                      <span>AI CORE</span>
                      <span className={isAiLoading ? "text-yellow-500 animate-pulse" : smartScript ? "text-[#9d00ff]" : "text-gray-600"}>
                        {isAiLoading ? "COMPUTING" : smartScript ? "READY" : "IDLE"}
                      </span>
                    </div>
                 </div>
               )}
            </div>
            <SystemTerminal logs={logs} />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <DataViewer 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              binaryContent={getBinaryDisplay()}
              pythonRawContent={getPythonRawDisplay()}
              pythonSmartContent={smartScript || "# Waiting for AI analysis..."}
              isAiLoading={isAiLoading}
              onAiCommand={handleAiCommand}
            />
          </div>
       </div>
       
       {/* Veo Visualizer Section */}
       <SuccessVisualizer onLog={addLog} customApiKey={customApiKey || undefined} />

       <SystemExport onSyncKey={handleSyncKey} />
    </ROGLayout>
  );
};
export default App;`;

const SUCCESS_VISUALIZER = `import React, { useState, useRef } from 'react';
import { Video, Upload, Film, Play, AlertTriangle, Key, RefreshCw } from 'lucide-react';
import { generateTeamSuccessVideo } from '../services/geminiService';

interface SuccessVisualizerProps {
  onLog: (text: string, type: 'info' | 'success' | 'warning' | 'error' | 'system') => void;
  customApiKey?: string;
}

const SuccessVisualizer: React.FC<SuccessVisualizerProps> = ({ onLog, customApiKey }) => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{data: string, mime: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatar(result); // For display
        // Extract base64 data for API
        const base64Data = result.split(',')[1];
        setAvatarFile({ data: base64Data, mime: file.type });
        onLog(\`AVATAR_UPLOADED: \${file.name}\`, 'info');
        setAuthError(false); // Reset error on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSyncKey = async () => {
     const win = window as any;
     if (win.aistudio) {
        onLog('OPENING_SECURE_UPLINK...', 'system');
        try {
            await win.aistudio.openSelectKey();
            onLog('UPLINK_ESTABLISHED. RETRYING_SEQUENCE...', 'success');
            setAuthError(false);
            // Automatically retry generation if an avatar is ready
            if (avatarFile) {
               handleGenerateClick();
            }
        } catch (e) {
            onLog('UPLINK_ABORTED_BY_USER', 'error');
        }
     } else {
        onLog('ERROR: AI_STUDIO_BRIDGE_NOT_FOUND', 'error');
     }
  };

  const handleGenerateClick = async () => {
    if (!avatarFile) {
        onLog('ERROR: AVATAR_REQUIRED_FOR_SYNTHESIS', 'error');
        return;
    }

    setIsGenerating(true);
    setAuthError(false);
    onLog('INITIALIZING_VEO_ENGINE...', 'system');
    onLog('CONTEXT: TEAM_SUCCESS_SEQUENCE', 'info');

    try {
        // Use customApiKey if available, otherwise environment key
        const videoUri = await generateTeamSuccessVideo(avatarFile.data, avatarFile.mime, customApiKey);
        setVideoUrl(videoUri);
        onLog('RENDER_COMPLETE: MEMORY_CONSTRUCT_FINALIZED', 'success');
    } catch (error: any) {
        console.error(error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        // Check for the specific 404 "Requested entity was not found"
        // This usually means the current API key project doesn't have access to Veo (requires Paid Tier)
        if (errorMsg.includes('404') || errorMsg.includes('Requested entity was not found') || errorMsg.includes('NOT_FOUND')) {
            setAuthError(true);
            onLog('ACCESS_DENIED: VEO_MODEL_REQUIRES_PAID_PROJECT', 'error');
            onLog('ACTION_REQUIRED: SYNC_NEURAL_UPLINK_WITH_BILLING_ENABLED', 'warning');
        } else {
            onLog(\`RENDER_FAILED: \${errorMsg}\`, 'error');
        }
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-[#080808] border border-[#222] rounded-lg p-6 relative overflow-hidden group mb-8 shadow-lg shadow-black/50">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-[#111] border border-[#333] rounded">
                    <Film className="w-5 h-5 text-[#9d00ff]" />
                </div>
                <div>
                    <h2 className="text-xl font-rog text-white">NEURAL CINEMA</h2>
                    <p className="text-[10px] font-mono text-gray-500 tracking-widest">PROJECT_JOURNEY_VISUALIZER // VEO_3.1</p>
                </div>
            </div>
            
            {/* Direct Sync Button - Always Visible but highlighted on error */}
            <button
                onClick={handleSyncKey}
                className={\`
                    flex items-center gap-2 px-3 py-1.5 text-[10px] font-rog tracking-wider border rounded transition-all duration-300
                    \${authError 
                        ? 'border-[#ff0033] bg-[#ff0033]/10 text-[#ff0033] animate-pulse' 
                        : 'border-[#333] bg-[#111] text-gray-400 hover:text-white hover:border-gray-500'
                    }
                \`}
            >
                <Key size={12} />
                {authError ? 'SYNC UPLINK (REQUIRED)' : 'SYNC NEURAL UPLINK'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={\`
                        h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden
                        \${avatar ? 'border-[#9d00ff] bg-black' : 'border-[#333] bg-[#0a0a0a] hover:border-[#9d00ff] hover:bg-[#9d00ff]/5'}
                    \`}
                >
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                    
                    {avatar ? (
                        <>
                            <img src={avatar} alt="Pilot Avatar" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="relative z-10 bg-black/70 px-4 py-2 rounded border border-[#9d00ff] text-[#9d00ff] font-rog text-xs">
                                PILOT IDENTITY CONFIRMED
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-gray-600 mb-2" />
                            <span className="text-xs font-mono text-gray-500">UPLOAD PILOT AVATAR</span>
                        </>
                    )}
                </div>

                <div className="bg-[#111] p-3 rounded border border-[#333]">
                    <p className="text-[10px] font-mono text-gray-400 mb-2">
                        <span className="text-[#9d00ff]">NARRATIVE_SCRIPT:</span> "THE_TEAM"
                    </p>
                    <p className="text-xs text-gray-300 italic">
                        "A cinematic sequence of the Pilot and the AI Assistant working in perfect sync. 
                        Code streams, holographic success indicators, and a celebration of our joint journey."
                    </p>
                </div>

                {authError ? (
                     <div className="p-3 bg-[#ff0033]/10 border border-[#ff0033] rounded flex flex-col items-center gap-2 text-center">
                        <AlertTriangle className="w-5 h-5 text-[#ff0033]" />
                        <span className="text-xs font-rog text-[#ff0033]">ACCESS DENIED: 404</span>
                        <p className="text-[10px] text-gray-400 font-mono">
                            Veo 3.1 Model requires a Google Cloud Project with Billing Enabled. 
                            Please click 'Sync Uplink' above or Inject Key below to fix.
                        </p>
                     </div>
                ) : (
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerating || !avatar}
                        className={\`
                            w-full py-3 font-rog text-sm tracking-widest clip-rog relative group overflow-hidden
                            \${isGenerating 
                                ? 'bg-[#333] cursor-not-allowed text-gray-500' 
                                : !avatar 
                                    ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                                    : 'bg-[#111] border border-[#9d00ff] text-white hover:bg-[#9d00ff]/20'
                            }
                        \`}
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center gap-2 animate-pulse">
                                <Video className="w-4 h-4" /> RENDERING...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Play className="w-4 h-4 fill-current" /> GENERATE MEMORY
                            </span>
                        )}
                    </button>
                )}
                
                <p className="text-[9px] text-gray-600 font-mono text-center">
                   * REQUIRES PAID BILLING PROJECT FOR VIDEO GENERATION (VEO MODEL)
                </p>
            </div>

            {/* Output Section */}
            <div className="bg-black border border-[#333] rounded-lg h-64 md:h-auto flex items-center justify-center relative overflow-hidden">
                {videoUrl ? (
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-center p-6">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#9d00ff] border-t-transparent rounded-full animate-spin"></div>
                                <div className="font-rog text-[#9d00ff] animate-pulse">PROCESSING NEURAL VIDEO</div>
                                <div className="font-mono text-[10px] text-gray-500">ESTIMATED TIME: 30-60 SECONDS</div>
                            </div>
                        ) : (
                            <div className="text-gray-700 font-rog text-2xl opacity-20 select-none">
                                AWAITING RENDER
                            </div>
                        )}
                    </div>
                )}
                
                {/* Screen Glare */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9d00ff] rounded-full filter blur-[80px] opacity-10 pointer-events-none"></div>
    </div>
  );
};

export default SuccessVisualizer;`;

const SYSTEM_TERMINAL = `import React, { useEffect, useRef } from 'react';
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
               <span className={\`\${
                 log.type === 'error' ? 'text-red-500 font-bold' : 
                 log.type === 'success' ? 'text-[#00ccff]' : 
                 log.type === 'warning' ? 'text-yellow-500' :
                 log.type === 'system' ? 'text-[#ff0033]' : 'text-gray-400'
               }\`}>
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

export default SystemTerminal;`;

const SystemExport: React.FC<SystemExportProps> = ({ onSyncKey }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState("");
  const [tempKey, setTempKey] = useState("");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  // Command to set up the env file via terminal
  const terminalCommand = `echo "API_KEY=${tempKey || 'YOUR_KEY_HERE'}" > .env`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInjectKey = () => {
    if (tempKey) {
        onSyncKey(tempKey);
    }
  };

  const getProjectFiles = () => {
    // 1. Create Package.json with explicit network hosting script
    const packageJson = {
        "name": "rog-universal-converter",
        "private": true,
        "version": "1.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite --host",
          "build": "tsc && vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^19.2.3",
          "react-dom": "^19.2.3",
          "@google/genai": "^1.34.0",
          "lucide-react": "^0.562.0",
          "jszip": "^3.10.1"
        },
        "devDependencies": {
          "@types/react": "^19.2.3",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^4.2.1",
          "typescript": "^5.2.2",
          "vite": "^5.0.0",
          "autoprefixer": "^10.4.16",
          "postcss": "^8.4.31",
          "tailwindcss": "^3.3.5"
        }
    };

    const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true // Mandatory for Local Network access
  },
  define: {
    'process.env': process.env
  }
})
`;
    
    const tsConfig = {
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
    };

    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ROG Universal Converter</title>
    <link rel="manifest" href="/manifest.json" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#050505] text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

    const readme = `
# ROG Universal Converter (Local Network Edition)

This version is pre-configured to broadcast on your local Wi-Fi network, allowing you to access it from your Android phone.

## 1. PC Installation (Recommended)

1. **Install Node.js**: Download from https://nodejs.org/
2. **Setup**:
   \`\`\`bash
   npm install
   \`\`\`
3. **Configure API Key**:
   Create a file named \`.env\` in this folder and add:
   \`\`\`
   API_KEY=your_gemini_api_key_here
   \`\`\`
4. **Run Server**:
   \`\`\`bash
   npm run dev
   \`\`\`
5. **Connect from Phone**:
   - Look at the terminal output. It will say:
     \`Network: http://192.168.x.x:5173\`
   - Ensure your Phone is on the **same Wi-Fi**.
   - Type that IP address into Chrome on your Android.

---

## 2. Termux Installation (Android Power User)

If you want to run the server *on* the phone itself without a PC:

1. Install **Termux** from F-Droid.
2. Run these commands inside Termux:
   \`\`\`bash
   pkg install nodejs
   # Copy the extracted files to a folder in Termux, then cd into it
   npm install
   # Create .env with nano or vim
   npm run dev
   \`\`\`
3. Open \`http://localhost:5173\` in your mobile browser.
`;

    // Map of filename -> content
    return {
        "package.json": JSON.stringify(packageJson, null, 2),
        "vite.config.ts": viteConfig,
        "tsconfig.json": JSON.stringify(tsConfig, null, 2),
        "tsconfig.node.json": JSON.stringify({
            "compilerOptions": {
              "composite": true,
              "skipLibCheck": true,
              "module": "ESNext",
              "moduleResolution": "bundler",
              "allowSyntheticDefaultImports": true
            },
            "include": ["vite.config.ts"]
        }, null, 2),
        "index.html": indexHtml,
        ".env.example": "API_KEY=your_gemini_key_here",
        "README.md": readme,
        "src/index.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #050505;
  font-family: 'Rajdhani', sans-serif;
  color: #e0e0e0;
  overflow-x: hidden;
}
.font-rog { font-family: 'Orbitron', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #ff0033; }

@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 5px #ff0033, 0 0 10px #ff0033; border-color: #ff0033; }
  33% { box-shadow: 0 0 5px #00ccff, 0 0 10px #00ccff; border-color: #00ccff; }
  66% { box-shadow: 0 0 5px #9d00ff, 0 0 10px #9d00ff; border-color: #9d00ff; }
}
.clip-rog { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%); }
.clip-rog-top { clip-path: polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px); }
        `,
        "src/main.tsx": `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
        "src/App.tsx": APP_FILE,
        "src/types.ts": TYPE_DEFS,
        "src/components/ROGLayout.tsx": ROG_LAYOUT,
        "src/components/FileUpload.tsx": FILE_UPLOAD,
        "src/components/DataViewer.tsx": DATA_VIEWER,
        "src/components/SystemTerminal.tsx": SYSTEM_TERMINAL,
        "src/components/SuccessVisualizer.tsx": SUCCESS_VISUALIZER,
        "src/components/SystemExport.tsx": "// Export disabled in exported version\nimport React from 'react';\nconst SystemExport = () => null;\nexport default SystemExport;",
        "src/services/geminiService.ts": GEMINI_SERVICE,
        "src/utils/fileUtils.ts": UTILS_FILE
    };
  };

  const exportProject = async () => {
    setIsExporting(true);
    setStatus("INITIALIZING CORE DUMP...");
    
    try {
      const zip = new JSZip();
      const files = getProjectFiles();

      // Fetch manifest separately
      let manifestStr = "{}";
      try {
        const manifestRes = await fetch('./manifest.json');
        if(manifestRes.ok) manifestStr = await manifestRes.text();
      } catch(e) {}
      zip.file("public/manifest.json", manifestStr);

      // Add files to zip
      for (const [path, content] of Object.entries(files)) {
          zip.file(path, content);
      }

      setStatus("COMPRESSING BINARIES...");
      const content = await zip.generateAsync({ type: "blob" });
      
      setStatus("INITIATING TRANSFER...");
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "ROG_UNIVERSAL_CONVERTER_SOURCE.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
          setIsExporting(false);
          setStatus("");
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus("SYSTEM ERROR: EXPORT FAILED");
      setTimeout(() => setIsExporting(false), 3000);
    }
  };

  const openStackBlitz = () => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://stackblitz.com/run?file=src%2FApp.tsx';
    form.target = '_blank';

    const addInput = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    };

    addInput('project[title]', 'ROG Universal Converter');
    addInput('project[description]', 'ROG Themed Converter with Gemini AI');
    addInput('project[template]', 'node');
    addInput('project[tags][0]', 'vite');
    addInput('project[tags][1]', 'react');
    addInput('project[tags][2]', 'typescript');

    const files = getProjectFiles();
    for (const [path, content] of Object.entries(files)) {
        addInput(`project[files][\${path}]`, content);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="w-full mt-8 p-6 bg-[#080808] border-t border-[#222]">
       <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h3 className="text-white font-rog text-lg flex items-center gap-2">
                <Package className="text-[#ff0033]" />
                COMMAND CENTER // DEPLOYMENT
            </h3>
            <p className="text-gray-500 text-xs font-mono mt-1">
                SELECT TARGET ENVIRONMENT FOR EXPORT
            </p>
          </div>
          
          <button 
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className={`
                mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 text-xs font-rog tracking-widest border rounded
                transition-all duration-300
                ${showKeyConfig 
                    ? 'border-[#00ccff] bg-[#00ccff]/10 text-[#00ccff]' 
                    : 'border-[#333] bg-[#111] text-gray-400 hover:border-gray-500'
                }
            `}
          >
            <Key size={14} />
            NEURAL LINK CONFIG
            <ChevronRight size={14} className={`transform transition-transform ${showKeyConfig ? 'rotate-90' : ''}`} />
          </button>
       </div>

       {/* API Key Helper Section */}
       {showKeyConfig && (
         <div className="mb-6 bg-[#111] border border-[#333] p-4 rounded-lg clip-rog relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#00ccff]"></div>
             <h4 className="text-[#00ccff] font-rog text-sm mb-2 flex items-center gap-2">
                <Terminal size={14} />
                SECURE KEY INJECTION PROTOCOL
             </h4>
             <p className="text-gray-500 text-xs font-mono mb-4">
                Since this is a client-side app, you must set your API Key in the environment securely. 
                Enter your key below to generate the exact terminal command for PC or Termux.
             </p>
             
             <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1">
                     <label className="text-[10px] text-gray-600 font-mono mb-1 block">PASTE GEMINI API KEY HERE</label>
                     <input 
                        type="password" 
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="AIzaSy..." 
                        className="w-full bg-[#050505] border border-[#333] text-gray-300 text-sm p-2 font-mono rounded focus:border-[#00ccff] focus:outline-none"
                     />
                 </div>
                 <div className="flex-[2]">
                     <label className="text-[10px] text-gray-600 font-mono mb-1 block">GENERATED TERMINAL COMMAND (RUN THIS IN FOLDER)</label>
                     <div className="flex gap-2">
                        <code className="flex-1 bg-[#050505] border border-[#333] text-[#00ccff] p-2 text-xs font-mono rounded overflow-x-auto whitespace-nowrap">
                            {terminalCommand}
                        </code>
                        <button 
                            onClick={copyToClipboard}
                            className="bg-[#333] hover:bg-[#444] text-white p-2 rounded transition-colors"
                            title="Copy Command"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        
                        <div className="w-[1px] bg-[#333] mx-1"></div>

                        {/* NEW SYNC BUTTON */}
                        <button 
                            onClick={handleInjectKey}
                            disabled={!tempKey}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded transition-all duration-300
                                ${tempKey 
                                    ? 'bg-[#00ccff]/10 text-[#00ccff] hover:bg-[#00ccff] hover:text-black border border-[#00ccff]' 
                                    : 'bg-[#222] text-gray-600 cursor-not-allowed border border-[#333]'
                                }
                            `}
                            title="Establish Neural Link (Use Key Now)"
                        >
                            <Zap size={16} />
                            <span className="text-[10px] font-rog tracking-wider hidden lg:inline">ESTABLISH NEURAL LINK</span>
                        </button>

                     </div>
                 </div>
             </div>
         </div>
       )}

       {/* Export Buttons Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Button 1: Download Zip (Localhost Focus) */}
           <button
             onClick={exportProject}
             disabled={isExporting}
             className={`
               relative group p-6 bg-[#111] border border-[#333] 
               hover:border-[#ff0033] hover:bg-[#ff0033]/5 
               transition-all duration-300 rounded-lg overflow-hidden text-left
               ${isExporting ? 'opacity-70 cursor-wait' : ''}
             `}
           >
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333] group-hover:border-[#ff0033] transition-colors">
                    {isExporting ? (
                        <div className="w-4 h-4 border-2 border-[#ff0033] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Wifi className="w-5 h-5 text-[#ff0033]" />
                    )}
                </div>
                <div>
                    <div className="font-rog text-white text-sm">LOCAL HARDLINE</div>
                    <div className="font-mono text-[10px] text-gray-500">PC / TERMUX DEPLOYMENT</div>
                </div>
             </div>
             <p className="text-gray-600 text-xs font-mono pl-14">
                Download full source code (ZIP). Run locally on your network. Best for privacy and offline capability.
             </p>
             <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff0033] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
           </button>

           {/* Button 2: StackBlitz */}
           <button
             onClick={openStackBlitz}
             className={`
               relative group p-6 bg-[#111] border border-[#333] 
               hover:border-[#00ccff] hover:bg-[#00ccff]/5 
               transition-all duration-300 rounded-lg overflow-hidden text-left
             `}
           >
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333] group-hover:border-[#00ccff] transition-colors">
                    <Code2 className="w-5 h-5 text-[#00ccff]" />
                </div>
                <div>
                    <div className="font-rog text-white text-sm flex items-center gap-2">
                        CLOUD UPLINK <ExternalLink size={10} className="opacity-50" />
                    </div>
                    <div className="font-mono text-[10px] text-gray-500">INSTANT MOBILE IDE</div>
                </div>
             </div>
             <p className="text-gray-600 text-xs font-mono pl-14">
                Launch directly into StackBlitz container. Zero setup required. Perfect for testing on phone browser immediately.
             </p>
             <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00ccff] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
           </button>
       </div>
       
       <div className="mt-4 text-[10px] font-mono text-gray-700 text-center">
          SYSTEM STATUS: READY FOR EXPORT // PROTOCOL V.3.2.1
       </div>
    </div>
  );
};

export default SystemExport;