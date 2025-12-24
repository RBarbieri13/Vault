export type Tool = {
  id: string;
  name: string;
  url: string;
  type: string;
  summary: string;
  tags: string[];
  categoryId: string;
  isPinned: boolean;
  createdAt: number;
  whatItIs: string;
  capabilities: string[];
  bestFor: string[];
  notes?: string;
};

export type Category = {
  id: string;
  name: string;
  collapsed: boolean;
  toolIds: string[]; // Order of tools
};

export type AppState = {
  categories: Category[];
  tools: Record<string, Tool>; // Normalized for easier lookup
  selectedToolId: string | null;
  searchQuery: string;
  isSidebarOpen: boolean;
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_chatbots', name: 'Chatbots & Assistants', collapsed: false, toolIds: ['tool_openai', 'tool_clickup'] },
  { id: 'cat_image', name: 'Image & Creative', collapsed: false, toolIds: ['tool_google_labs', 'tool_reimagine', 'tool_simular'] },
  { id: 'cat_dev', name: 'Development & Agents', collapsed: false, toolIds: ['tool_adeptly', 'tool_punku'] },
];

export const INITIAL_TOOLS: Record<string, Tool> = {
  'tool_openai': {
    id: 'tool_openai',
    name: 'OpenAI ChatGPT',
    url: 'https://chat.openai.com',
    type: 'Chatbot',
    summary: 'Advanced AI language model for conversation, coding, and content generation.',
    tags: ['LLM', 'Productivity', 'General'],
    categoryId: 'cat_chatbots',
    isPinned: true,
    createdAt: Date.now(),
    whatItIs: 'A conversational AI model developed by OpenAI that uses deep learning to generate human-like text responses based on user inputs.',
    capabilities: [
      'Generates text, code, and creative content',
      'Provides answers to complex queries across various domains',
      'Supports context-aware conversations and follow-up questions',
      'Analyzes and summarizes large volumes of text'
    ],
    bestFor: [
      'General purpose queries and research',
      'Code generation and debugging',
      'Drafting and editing written content'
    ]
  },
  'tool_google_labs': {
    id: 'tool_google_labs',
    name: 'Google Labs CC',
    url: 'https://labs.google',
    type: 'Creative Suite',
    summary: 'Experimental AI tools and features from Google.',
    tags: ['Experimental', 'Google', 'Creative'],
    categoryId: 'cat_image',
    isPinned: false,
    createdAt: Date.now(),
    whatItIs: 'An experimental playground where Google tests early-stage AI projects and features before wider release.',
    capabilities: [
      'Access early-access AI experiments',
      'Test new generative AI features for creative work',
      'Provide feedback directly to Google engineering teams'
    ],
    bestFor: [
      'Early adopters wanting to test new tech',
      'Exploring experimental creative tools',
      'Tracking Google’s AI development roadmap'
    ]
  },
  'tool_reimagine': {
    id: 'tool_reimagine',
    name: 'REimagineHome.ai',
    url: 'https://reimaginehome.ai',
    type: 'Design Tool',
    summary: 'AI-powered interior design and virtual staging platform.',
    tags: ['Real Estate', 'Design', '3D'],
    categoryId: 'cat_image',
    isPinned: false,
    createdAt: Date.now(),
    whatItIs: 'An AI-driven platform for virtual staging and interior redesign that transforms photos of empty or furnished spaces.',
    capabilities: [
      'Virtually stages empty rooms with furniture and decor',
      'Redesigns existing spaces with different styles',
      'Enhances exterior curb appeal',
      'Removes unwanted objects from property photos'
    ],
    bestFor: [
      'Real estate agents and property managers',
      'Interior designers visualizing concepts',
      'Homeowners planning renovations'
    ]
  },
  'tool_adeptly': {
    id: 'tool_adeptly',
    name: 'Adeptly',
    url: 'https://adeptly.ai',
    type: 'Agent Platform',
    summary: 'Build and deploy AI agents for various tasks.',
    tags: ['Agents', 'Automation', 'No-code'],
    categoryId: 'cat_dev',
    isPinned: false,
    createdAt: Date.now(),
    whatItIs: 'A platform for building, testing, and deploying autonomous AI agents that can perform tasks and interact with other systems.',
    capabilities: [
      'Design custom AI agents with specific behaviors',
      'Test agent performance in simulated environments',
      'Deploy agents to handle automated workflows',
      'Monitor and analytics for agent activities'
    ],
    bestFor: [
      'Developers building autonomous systems',
      'Automating complex, multi-step workflows',
      'Creating specialized AI assistants'
    ]
  },
  'tool_punku': {
    id: 'tool_punku',
    name: 'PUNKU.ai',
    url: 'https://punku.ai',
    type: 'Developer Tool',
    summary: 'AI-powered development assistant.',
    tags: ['Coding', 'Developer Experience'],
    categoryId: 'cat_dev',
    isPinned: false,
    createdAt: Date.now(),
    whatItIs: 'A specialized AI development tool designed to assist with coding tasks and streamline the software development lifecycle.',
    capabilities: [
      'Assists with code generation and refactoring',
      'Provides intelligent code completion and suggestions',
      'Helps debug and optimize existing codebases',
      'Integrates with common development environments'
    ],
    bestFor: [
      'Software engineers and developers',
      'Accelerating coding workflows',
      'Improving code quality and consistency'
    ]
  },
  'tool_simular': {
    id: 'tool_simular',
    name: 'Simular AI',
    url: 'https://simular.ai',
    type: 'Simulation',
    summary: 'AI platform for creating realistic simulations.',
    tags: ['Simulation', 'Data', 'Modeling'],
    categoryId: 'cat_image', 
    isPinned: false,
    createdAt: Date.now(),
    whatItIs: 'An AI platform focused on generating high-fidelity simulations and synthetic data for training and testing AI models.',
    capabilities: [
      'Generates photorealistic synthetic environments',
      'Creates diverse scenarios for edge-case testing',
      'Simulates physical interactions and dynamics',
      'Scales data generation for ML model training'
    ],
    bestFor: [
      'Computer vision researchers',
      'Autonomous vehicle testing',
      'Robotics simulation and training'
    ]
  },
  'tool_clickup': {
    id: 'tool_clickup',
    name: 'ClickUp Chat',
    url: 'https://clickup.com/features/chat',
    type: 'Productivity',
    summary: 'AI-integrated chat within ClickUp for task management.',
    tags: ['Project Management', 'Collaboration'],
    categoryId: 'cat_chatbots',
    isPinned: true,
    createdAt: Date.now(),
    whatItIs: 'A built-in chat interface within the ClickUp platform that leverages AI to connect conversations directly to tasks and projects.',
    capabilities: [
      'Contextualizes chat messages with task data',
      'Summarizes long discussion threads',
      'Creates tasks directly from chat messages',
      'Provides AI-driven answers from workspace knowledge'
    ],
    bestFor: [
      'Teams using ClickUp for project management',
      'Reducing context switching between chat and tasks',
      'Streamlining internal communication'
    ]
  },
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
