import { GeneratorType, PromptConfig } from "./types.ts";

export const GEMINI_MODELS = {
  FAST: 'gemini-flash-lite-latest',
  STANDARD: 'gemini-3-flash-preview',
  COMPLEX: 'gemini-3-pro-preview', // For coding/thinking
};

export const GROQ_MODELS = {
  FAST: 'llama-3.1-8b-instant',
  STANDARD: 'llama-3.1-70b-versatile',
  COMPLEX: 'llama-3.1-70b-versatile',
  LARGE_CONTEXT: 'mixtral-8x7b-32768',
};

// Added missing GENERATOR_PROMPTS configurations
export const GENERATOR_PROMPTS: Record<GeneratorType, PromptConfig> = {
  [GeneratorType.ARCHITECTURE]: {
    id: GeneratorType.ARCHITECTURE,
    title: 'System Architecture',
    description: 'Detailed technical architecture for RAM Vista including NBD and Redis layers.',
    model: GEMINI_MODELS.COMPLEX,
    systemInstruction: 'You are a senior systems architect specializing in distributed memory systems and Linux kernel modules.',
    userPrompt: 'Generate a comprehensive system architecture for a project called "RAM Vista" that virtualizes remote RAM as local block devices using NBD and Redis.',
    isComplex: true,
  },
  [GeneratorType.PYTHON_ENGINE]: {
    id: GeneratorType.PYTHON_ENGINE,
    title: 'NBD Control Engine',
    description: 'Python-based control logic for managing NBD devices and Redis backends.',
    model: GEMINI_MODELS.COMPLEX,
    systemInstruction: 'You are an expert Python developer with deep knowledge of Linux system calls and NBD.',
    userPrompt: 'Write a Python script that manages nbd-client connections to a remote Redis-backed NBD server.',
    isComplex: true,
  },
  [GeneratorType.DASHBOARD_CODE]: {
    id: GeneratorType.DASHBOARD_CODE,
    title: 'React Monitoring View',
    description: 'Modern UI code for the monitoring interface.',
    model: GEMINI_MODELS.STANDARD,
    systemInstruction: 'You are a world-class frontend engineer expert in React, Tailwind, and Recharts.',
    userPrompt: 'Create a sophisticated React component for monitoring memory pressure and offloading status.',
    isComplex: false,
  },
  [GeneratorType.PITCH]: {
    id: GeneratorType.PITCH,
    title: 'Hackathon Pitch',
    description: 'A compelling pitch for the RAM Vista project.',
    model: GEMINI_MODELS.STANDARD,
    systemInstruction: 'You are a tech entrepreneur and master storyteller.',
    userPrompt: 'Write a 2-minute pitch for RAM Vista, explaining how it solves memory bottlenecks for developers.',
    isComplex: false,
  }
};