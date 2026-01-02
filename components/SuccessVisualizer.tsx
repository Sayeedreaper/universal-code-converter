import React, { useState, useRef } from 'react';
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
        onLog(`AVATAR_UPLOADED: ${file.name}`, 'info');
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
            onLog(`RENDER_FAILED: ${errorMsg}`, 'error');
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
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-[10px] font-rog tracking-wider border rounded transition-all duration-300
                    ${authError 
                        ? 'border-[#ff0033] bg-[#ff0033]/10 text-[#ff0033] animate-pulse' 
                        : 'border-[#333] bg-[#111] text-gray-400 hover:text-white hover:border-gray-500'
                    }
                `}
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
                    className={`
                        h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden
                        ${avatar ? 'border-[#9d00ff] bg-black' : 'border-[#333] bg-[#0a0a0a] hover:border-[#9d00ff] hover:bg-[#9d00ff]/5'}
                    `}
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
                        className={`
                            w-full py-3 font-rog text-sm tracking-widest clip-rog relative group overflow-hidden
                            ${isGenerating 
                                ? 'bg-[#333] cursor-not-allowed text-gray-500' 
                                : !avatar 
                                    ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                                    : 'bg-[#111] border border-[#9d00ff] text-white hover:bg-[#9d00ff]/20'
                            }
                        `}
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

export default SuccessVisualizer;