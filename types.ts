
export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface User {
  email: string;
  name: string;
  age?: number;
  role?: string;
  company?: string;
  bio?: string;
}

// Added missing GeneratorType enum for the artifact generator
export enum GeneratorType {
  ARCHITECTURE = 'ARCHITECTURE',
  PYTHON_ENGINE = 'PYTHON_ENGINE',
  DASHBOARD_CODE = 'DASHBOARD_CODE',
  PITCH = 'PITCH'
}

// Added missing PromptConfig interface for artifact generation definitions
export interface PromptConfig {
  id: GeneratorType;
  title: string;
  description: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  isComplex: boolean;
}
