import React, { useRef, useState } from 'react';
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
        className={`
          relative group cursor-pointer
          bg-[#0a0a0a] border-2 border-dashed 
          ${isDragging ? 'border-[#00ccff] bg-[#00ccff]/5' : 'border-[#333] hover:border-[#ff0033] hover:bg-[#ff0033]/5'}
          transition-all duration-300 ease-out
          clip-rog rounded-lg p-10
          flex flex-col items-center justify-center
          min-h-[200px]
        `}
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
              <div className={`
                w-16 h-16 rounded-full bg-[#111] border border-[#333] 
                flex items-center justify-center mb-4 
                group-hover:scale-110 group-hover:border-[#ff0033] group-hover:shadow-[0_0_15px_rgba(255,0,51,0.5)]
                transition-all duration-300
              `}>
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

export default FileUpload;