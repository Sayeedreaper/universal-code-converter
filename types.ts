export interface ProcessedFile {
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
  PYTHON_SMART = 'PYTHON_SMART',
  GEMINI_CHAT = 'GEMINI_CHAT'
}

export interface AnalysisState {
  loading: boolean;
  content: string | null;
  error: string | null;
}

export interface Gem {
  id: string;
  name: string;
  model: string;
  instruction?: string;
  type: 'system' | 'custom';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}