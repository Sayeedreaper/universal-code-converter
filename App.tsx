import React, { useState, useEffect } from 'react';
import ROGLayout from './components/ROGLayout';
import FileUpload from './components/FileUpload';
import DataViewer from './components/DataViewer';
import SystemExport from './components/SystemExport';
import SystemTerminal, { LogEntry } from './components/SystemTerminal';
import SuccessVisualizer from './components/SuccessVisualizer';
import { ProcessedFile, TabOption, Gem, ChatMessage } from './types';
import { bufferToHex, bufferToPythonBytes, bufferToBinaryString } from './utils/fileUtils';
import { generateSmartPythonScript, sendGeminiChat } from './services/geminiService';

const DEFAULT_GEMS: Gem[] = [
  { id: 'gemini-flash', name: 'Gemini 3 Flash (Fast)', model: 'gemini-3-flash-preview', type: 'system' },
  { id: 'gemini-pro', name: 'Gemini 3 Pro (Reasoning)', model: 'gemini-3-pro-preview', type: 'system' },
  { id: 'kai-custom', name: 'Kai (Custom Uplink)', model: 'gemini-3-pro-preview', type: 'custom', instruction: 'This is the "Kai" container. Please click the Settings/Edit icon above to paste the actual system instructions from your Kai Gem to sync its personality.' },
  { id: 'coder', name: 'The Coder', model: 'gemini-3-pro-preview', type: 'system', instruction: 'You are an expert software engineer specializing in Python, React, and low-level binary data analysis. Be concise and provide code blocks.' },
  { id: 'writer', name: 'Creative Core', model: 'gemini-3-pro-preview', type: 'system', instruction: 'You are a creative sci-fi writer. Respond in a cyberpunk style, using terminology like "uplink", "neural net", and "data stream".' }
];

const App: React.FC = () => {
  const [fileData, setFileData] = useState<ProcessedFile | null>(null);
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.BINARY);
  const [smartScript, setSmartScript] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gems, setGems] = useState<Gem[]>(DEFAULT_GEMS);
  const [activeGemId, setActiveGemId] = useState<string>('gemini-flash');
  const [isChatLoading, setIsChatLoading] = useState(false);

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
    addLog(`INITIATING_UPLOAD: ${file.name}`, 'system');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        addLog(`BUFFER_READ_SUCCESS: ${arrayBuffer.byteLength} bytes`, 'success');
        
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
        addLog(`MODULES_ENGAGED: HEX_VIEWER, BINARY_DECODER`, 'info');

        addLog(`CONTACTING_NEURAL_CORE (Gemini-3-Flash)...`, 'warning');
        await runAiAnalysis(file.name, file.type || 'unknown', hexPreview);
    } catch (err) {
        addLog(`ERROR_PROCESSING_FILE: ${err}`, 'error');
    }
  };

  const runAiAnalysis = async (name: string, type: string, hex: string, instruction?: string) => {
    setIsAiLoading(true);
    try {
      if (instruction) addLog(`USER_COMMAND_RECEIVED: "${instruction}"`, 'system');
      // Pass customApiKey if set
      const script = await generateSmartPythonScript(name, type, hex, instruction, customApiKey || undefined);
      setSmartScript(script);
      addLog(`NEURAL_GENERATION_COMPLETE: PYTHON_SCRIPT_READY`, 'success');
      if (instruction) {
        setActiveTab(TabOption.PYTHON_SMART);
        addLog(`INTERFACE_SWITCH: SMART_TAB`, 'info');
      }
    } catch (e) {
      console.error(e);
      setSmartScript("# Error generating AI script.");
      addLog(`NEURAL_CORE_FAILURE: API_CONNECTION_ERROR`, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiCommand = (instruction: string) => {
    if (!fileData) {
        addLog(`COMMAND_REJECTED: NO_FILE_LOADED`, 'error');
        return;
    }
    runAiAnalysis(fileData.name, fileData.type, fileData.hexPreview, instruction);
  };

  // Chat Handlers
  const handleCreateGem = (name: string, instruction: string) => {
    const newGem: Gem = {
      id: `custom-${Date.now()}`,
      name,
      model: 'gemini-3-pro-preview', // Default to Pro for custom reasoning
      type: 'custom',
      instruction
    };
    setGems(prev => [...prev, newGem]);
    setActiveGemId(newGem.id);
    addLog(`NEW_GEM_COMPILED: ${name}`, 'success');
  };

  const handleUpdateGem = (id: string, name: string, instruction: string) => {
    setGems(prev => prev.map(g => {
        if (g.id === id) {
            return { ...g, name, instruction };
        }
        return g;
    }));
    addLog(`GEM_PROTOCOL_UPDATED: ${name}`, 'success');
  };

  const handleChatSend = async (msgText: string) => {
    const gem = gems.find(g => g.id === activeGemId);
    if (!gem) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
        // Format history for API
        const history = chatMessages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const responseText = await sendGeminiChat(
            gem.model,
            history,
            msgText,
            gem.instruction,
            customApiKey || undefined
        );

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        console.error(e);
        addLog('CHAT_UPLINK_FAILED', 'error');
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "Error: Uplink connection failed. Please check your API Key or Network.",
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const getBinaryDisplay = () => {
    if (!fileData) return "";
    return `FILE_NAME: ${fileData.name}\nFILE_SIZE: ${fileData.size} bytes\nTYPE: ${fileData.type}\n\n[HEX DUMP START]\n${fileData.hexPreview}\n\n[BINARY STREAM START]\n${fileData.binaryString}\n...`;
  };

  const getPythonRawDisplay = () => {
    if (!fileData) return "";
    return `# RAW BYTE LOADER FOR: ${fileData.name}\n# Automatically generated\n\n${bufferToPythonBytes(fileData.arrayBuffer)}\n\nprint(f"Loaded {len(file_data)} bytes from raw buffer.")`;
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
              // Chat Props
              chatMessages={chatMessages}
              onChatSend={handleChatSend}
              gems={gems}
              activeGemId={activeGemId}
              onSelectGem={setActiveGemId}
              onCreateGem={handleCreateGem}
              onUpdateGem={handleUpdateGem}
              isChatLoading={isChatLoading}
            />
          </div>
       </div>
       
       {/* Veo Visualizer Section */}
       <SuccessVisualizer onLog={addLog} customApiKey={customApiKey || undefined} />

       <SystemExport onSyncKey={handleSyncKey} />
    </ROGLayout>
  );
};
export default App;