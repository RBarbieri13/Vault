// ============================================
// TYPE DEFINITIONS
// ============================================

export type ToolType = 'CHATBOT' | 'AGENT' | 'IMAGE' | 'WRITING' | 'CODE' | 'SEARCH' | 'VIDEO' | 'AUDIO' | 'CREATIVE' | 'DEV' | 'RESEARCH';
export type ToolStatus = 'active' | 'inactive' | 'beta' | 'deprecated';
export type ContentType = 'tool' | 'website' | 'video' | 'podcast' | 'article';

// Type and status constants for dropdowns
export const TOOL_TYPES: ToolType[] = ['CHATBOT', 'AGENT', 'IMAGE', 'WRITING', 'CODE', 'SEARCH', 'VIDEO', 'AUDIO', 'CREATIVE', 'DEV', 'RESEARCH'];
export const TOOL_STATUSES: ToolStatus[] = ['active', 'inactive', 'beta', 'deprecated'];
export const CONTENT_TYPES: ContentType[] = ['tool', 'website', 'video', 'podcast', 'article'];

export type Tool = {
  id: string;
  name: string;
  url: string;
  type: string;
  summary: string;
  tags: string[];
  categoryId: string;
  isPinned: boolean;
  createdAt: number | Date;
  whatItIs: string;
  capabilities: string[];
  bestFor: string[];
  notes?: string;
  icon?: string;
  trend: number[]; // 7 values for sparkline
  usage: number; // 0-100 percentage
  status: ToolStatus;
  contentType: ContentType;
};

export type Category = {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  collapsed: boolean;
  toolIds: string[]; // Order of tools
  sortOrder: number;
};

export type Collection = {
  id: string;
  name: string;
  icon?: string;
  toolIds: string[];
  sortOrder: number;
};

export type AppState = {
  categories: Category[];
  tools: Record<string, Tool>; // Normalized for easier lookup
  collections: Collection[];
  selectedToolId: string | null;
  searchQuery: string;
  isSidebarOpen: boolean;
  activeFilter: string; // Filter by type
  navItems: NavItem[]; // Hierarchical navigation
  // New filter state
  statusFilter: ToolStatus | 'all';
  typeFilter: ToolType | 'all';
  tagFilters: string[];
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year';
  contentTypeFilter: ContentType | 'all';
  selectedNavSection: string | null;
  lastSyncTime: Date | null;
};

// Navigation item for hierarchical sidebar
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  children?: NavItem[];
  isExpanded?: boolean;
  level: number;
  type: 'section' | 'category' | 'subcategory' | 'item';
}

// ============================================
// TYPE BADGE COLORS (matching reference image)
// ============================================

export const typeColors: Record<string, { bg: string; text: string }> = {
  CHATBOT: { bg: '#fef3c7', text: '#92400e' },
  AGENT: { bg: '#ffedd5', text: '#9a3412' },
  IMAGE: { bg: '#fce7f3', text: '#9d174d' },
  WRITING: { bg: '#dcfce7', text: '#166534' },
  CODE: { bg: '#dbeafe', text: '#1e40af' },
  DEV: { bg: '#dbeafe', text: '#1e40af' },
  SEARCH: { bg: '#ede9fe', text: '#5b21b6' },
  VIDEO: { bg: '#ccfbf1', text: '#115e59' },
  AUDIO: { bg: '#fee2e2', text: '#991b1b' },
  CREATIVE: { bg: '#fce7f3', text: '#9d174d' },
  RESEARCH: { bg: '#f3e8ff', text: '#6b21a8' },
  // Additional fallbacks
  Chatbot: { bg: '#fef3c7', text: '#92400e' },
  'Agent Platform': { bg: '#ffedd5', text: '#9a3412' },
  'Creative Suite': { bg: '#fce7f3', text: '#9d174d' },
  'Design Tool': { bg: '#fce7f3', text: '#9d174d' },
  Productivity: { bg: '#dcfce7', text: '#166534' },
  'Developer Tool': { bg: '#dbeafe', text: '#1e40af' },
  Simulation: { bg: '#ede9fe', text: '#5b21b6' },
};

// ============================================
// TAG BADGE COLORS (matching reference image)
// ============================================

export const tagColors: Record<string, { bg: string; text: string }> = {
  // Primary tags from reference
  LLM: { bg: '#dbeafe', text: '#1e40af' },
  Prod: { bg: '#dcfce7', text: '#166534' },
  Dev: { bg: '#e0e7ff', text: '#3730a3' },
  Test: { bg: '#ccfbf1', text: '#115e59' },
  Creative: { bg: '#fce7f3', text: '#9d174d' },
  Open: { bg: '#dcfce7', text: '#166534' },
  Beta: { bg: '#fef3c7', text: '#92400e' },
  Int: { bg: '#fef3c7', text: '#92400e' },
  // Additional tags
  Gen: { bg: '#f3e8ff', text: '#6b21a8' },
  Art: { bg: '#ffe4e6', text: '#9f1239' },
  Content: { bg: '#d1fae5', text: '#065f46' },
  Mkt: { bg: '#fef9c3', text: '#854d0e' },
  AI: { bg: '#e0f2fe', text: '#0369a1' },
  OSS: { bg: '#f0fdf4', text: '#15803d' },
  Research: { bg: '#faf5ff', text: '#7c3aed' },
  OpenAI: { bg: '#ecfdf5', text: '#047857' },
  IDE: { bg: '#f1f5f9', text: '#475569' },
  Notes: { bg: '#fff7ed', text: '#c2410c' },
  Edit: { bg: '#fdf2f8', text: '#be185d' },
  Voice: { bg: '#fff1f2', text: '#be123c' },
  TTS: { bg: '#fef2f2', text: '#b91c1c' },
  Avatar: { bg: '#f0fdfa', text: '#0f766e' },
  Ent: { bg: '#f8fafc', text: '#334155' },
  Auto: { bg: '#fefce8', text: '#a16207' },
  Google: { bg: '#ecfdf5', text: '#059669' },
  Fast: { bg: '#fef3c7', text: '#d97706' },
  Search: { bg: '#ede9fe', text: '#7c3aed' },
  Trans: { bg: '#f0f9ff', text: '#0284c7' },
  Productivity: { bg: '#dcfce7', text: '#166534' },
  General: { bg: '#f1f5f9', text: '#475569' },
  Experimental: { bg: '#fef3c7', text: '#92400e' },
  Agents: { bg: '#ffedd5', text: '#9a3412' },
  Automation: { bg: '#fefce8', text: '#a16207' },
  'No-code': { bg: '#e0f2fe', text: '#0369a1' },
  Coding: { bg: '#dbeafe', text: '#1e40af' },
  'Developer Experience': { bg: '#e0e7ff', text: '#3730a3' },
  'Real Estate': { bg: '#fef3c7', text: '#92400e' },
  Design: { bg: '#fce7f3', text: '#9d174d' },
  '3D': { bg: '#ede9fe', text: '#5b21b6' },
  Data: { bg: '#ccfbf1', text: '#115e59' },
  Modeling: { bg: '#f0fdfa', text: '#0f766e' },
  'Project Management': { bg: '#dcfce7', text: '#166534' },
  Collaboration: { bg: '#e0f2fe', text: '#0369a1' },
  Writing: { bg: '#dcfce7', text: '#166534' },
  Audio: { bg: '#fee2e2', text: '#991b1b' },
  default: { bg: '#f1f5f9', text: '#475569' },
};

// ============================================
// STATUS BADGE COLORS
// ============================================

export const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#dcfce7', text: '#166534' },
  inactive: { bg: '#f1f5f9', text: '#475569' },
  beta: { bg: '#fef3c7', text: '#92400e' },
  deprecated: { bg: '#fee2e2', text: '#991b1b' },
};

export const getTagColor = (tag: string) => tagColors[tag] || { bg: '#f1f5f9', text: '#475569' };
export const getTypeColor = (type: string) => typeColors[type] || { bg: '#f1f5f9', text: '#475569' };
export const getStatusColor = (status: string) => statusColors[status] || { bg: '#f1f5f9', text: '#475569' };

// ============================================
// INITIAL CATEGORIES (matching reference sidebar)
// ============================================

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_chatbots', name: 'Chatbots', icon: '💬', collapsed: false, toolIds: ['tool_openai', 'tool_clickup', 'tool_claude', 'tool_gemini', 'tool_llama'], sortOrder: 0 },
  { id: 'cat_llm', name: 'LLM-Based', icon: '🧠', parentId: 'cat_chatbots', collapsed: false, toolIds: ['tool_openai', 'tool_claude', 'tool_gemini'], sortOrder: 1 },
  { id: 'cat_creative', name: 'Creative', icon: '🎨', collapsed: false, toolIds: ['tool_midjourney', 'tool_dalle', 'tool_sd', 'tool_flux', 'tool_canva', 'tool_miro'], sortOrder: 2 },
  { id: 'cat_image', name: 'Image Gen', icon: '🖼️', parentId: 'cat_creative', collapsed: false, toolIds: ['tool_midjourney', 'tool_dalle', 'tool_sd', 'tool_flux'], sortOrder: 3 },
  { id: 'cat_editing', name: 'Editing', icon: '✂️', parentId: 'cat_creative', collapsed: false, toolIds: [], sortOrder: 4 },
  { id: 'cat_video', name: 'Video', icon: '📺', parentId: 'cat_creative', collapsed: false, toolIds: ['tool_runway', 'tool_pika', 'tool_synthesia'], sortOrder: 5 },
  { id: 'cat_dev', name: 'Development', icon: '💻', collapsed: false, toolIds: ['tool_copilot', 'tool_cursor', 'tool_adeptly', 'tool_huggingface'], sortOrder: 6 },
  { id: 'cat_writing', name: 'Writing', icon: '📝', collapsed: false, toolIds: ['tool_jasper', 'tool_notion'], sortOrder: 7 },
  { id: 'cat_research', name: 'Research', icon: '🔍', collapsed: false, toolIds: ['tool_perplexity'], sortOrder: 8 },
  { id: 'cat_agents', name: 'Agents', icon: '🤖', collapsed: false, toolIds: ['tool_adeptly'], sortOrder: 9 },
];

// ============================================
// INITIAL TOOLS (matching reference data)
// ============================================

export const INITIAL_TOOLS: Record<string, Tool> = {
  'tool_openai': {
    id: 'tool_openai',
    name: 'OpenAI ChatGPT',
    url: 'https://chat.openai.com',
    type: 'CHATBOT',
    summary: 'Conversational AI model for language tasks and content generation',
    tags: ['LLM', 'Prod'],
    categoryId: 'cat_chatbots',
    isPinned: true,
    createdAt: new Date('2024-12-24'),
    whatItIs: 'A conversational AI model developed by OpenAI that uses deep learning to generate human-like text responses.',
    capabilities: ['Text generation', 'Code assistance', 'Context-aware conversations'],
    bestFor: ['General queries', 'Code generation', 'Content drafting'],
    icon: '◎',
    trend: [3, 5, 4, 7, 6, 8, 7],
    usage: 94,
    status: 'active',
    contentType: 'tool',
  },
  'tool_clickup': {
    id: 'tool_clickup',
    name: 'ClickUp Chat',
    url: 'https://clickup.com/features/chat',
    type: 'CHATBOT',
    summary: 'Team chat interface with task integration',
    tags: ['Prod', 'Int'],
    categoryId: 'cat_chatbots',
    isPinned: false,
    createdAt: new Date('2024-12-20'),
    whatItIs: 'A built-in chat interface within ClickUp that connects conversations to tasks.',
    capabilities: ['Task linking', 'Thread summaries', 'AI answers'],
    bestFor: ['Project management', 'Team collaboration'],
    icon: '◈',
    trend: [2, 4, 5, 3, 4, 5, 4],
    usage: 67,
    status: 'active',
    contentType: 'tool',
  },
  'tool_adeptly': {
    id: 'tool_adeptly',
    name: 'Adeptly',
    url: 'https://adeptly.ai',
    type: 'AGENT',
    summary: 'Build autonomous AI agents for complex workflows',
    tags: ['Dev', 'Test'],
    categoryId: 'cat_agents',
    isPinned: false,
    createdAt: new Date('2024-12-18'),
    whatItIs: 'A platform for building and deploying AI agents.',
    capabilities: ['Agent design', 'Testing', 'Deployment'],
    bestFor: ['Automation', 'Agent workflows'],
    icon: 'A',
    trend: [1, 3, 5, 6, 7, 8, 9],
    usage: 45,
    status: 'active',
    contentType: 'tool',
  },
  'tool_midjourney': {
    id: 'tool_midjourney',
    name: 'Midjourney',
    url: 'https://midjourney.com',
    type: 'IMAGE',
    summary: 'AI image generation with artistic styles',
    tags: ['Creative'],
    categoryId: 'cat_image',
    isPinned: true,
    createdAt: new Date('2024-12-18'),
    whatItIs: 'An AI image generation tool accessible through Discord, known for artistic and stylized outputs.',
    capabilities: ['Text-to-image', 'Style control', 'Variations'],
    bestFor: ['Concept art', 'Illustrations', 'Creative projects'],
    icon: '⛵',
    trend: [8, 7, 9, 8, 9, 8, 9],
    usage: 98,
    status: 'active',
    contentType: 'tool',
  },
  'tool_claude': {
    id: 'tool_claude',
    name: 'Claude 2',
    url: 'https://claude.ai',
    type: 'CHATBOT',
    summary: 'Advanced reasoning and analysis assistant',
    tags: ['LLM', 'Beta'],
    categoryId: 'cat_chatbots',
    isPinned: true,
    createdAt: new Date('2024-12-17'),
    whatItIs: 'An AI assistant by Anthropic designed with a focus on safety and being helpful, harmless, and honest.',
    capabilities: ['Long-form analysis', 'Code generation', 'Research assistance'],
    bestFor: ['Complex analysis', 'Writing', 'Coding'],
    icon: 'C\\',
    trend: [4, 5, 6, 7, 8, 9, 9],
    usage: 89,
    status: 'active',
    contentType: 'tool',
  },
  'tool_gemini': {
    id: 'tool_gemini',
    name: 'Gemini Pro',
    url: 'https://gemini.google.com',
    type: 'CHATBOT',
    summary: 'Multimodal capabilities with Google integration',
    tags: ['LLM', 'Prod'],
    categoryId: 'cat_chatbots',
    isPinned: false,
    createdAt: new Date('2024-12-15'),
    whatItIs: 'Google multimodal AI model capable of understanding text, images, audio, and video.',
    capabilities: ['Multimodal understanding', 'Code generation', 'Research'],
    bestFor: ['Multimodal tasks', 'Google ecosystem integration'],
    icon: 'G',
    trend: [5, 6, 7, 7, 8, 8, 9],
    usage: 79,
    status: 'active',
    contentType: 'tool',
  },
  'tool_llama': {
    id: 'tool_llama',
    name: 'Llama 2',
    url: 'https://llama.meta.com',
    type: 'CHATBOT',
    summary: 'Open source model for custom deployments',
    tags: ['LLM', 'Open'],
    categoryId: 'cat_chatbots',
    isPinned: false,
    createdAt: new Date('2024-12-15'),
    whatItIs: 'Meta open-source large language model.',
    capabilities: ['Local deployment', 'Fine-tuning', 'Custom applications'],
    bestFor: ['Custom deployments', 'Research'],
    icon: '🦙',
    trend: [4, 5, 5, 6, 6, 7, 7],
    usage: 65,
    status: 'active',
    contentType: 'tool',
  },
  'tool_dalle': {
    id: 'tool_dalle',
    name: 'DALL-E 3',
    url: 'https://openai.com/dall-e-3',
    type: 'IMAGE',
    summary: 'High fidelity image generation with text rendering',
    tags: ['Creative', 'Prod'],
    categoryId: 'cat_image',
    isPinned: false,
    createdAt: new Date('2024-12-15'),
    whatItIs: 'OpenAI latest image generation model with improved text rendering capabilities.',
    capabilities: ['Text-to-image', 'Text in images', 'Detailed prompts'],
    bestFor: ['Marketing materials', 'Detailed illustrations'],
    icon: '◎',
    trend: [7, 8, 7, 8, 9, 8, 9],
    usage: 85,
    status: 'active',
    contentType: 'tool',
  },
  'tool_sd': {
    id: 'tool_sd',
    name: 'Stable Diffusion',
    url: 'https://stability.ai',
    type: 'IMAGE',
    summary: 'Local image generation with full control',
    tags: ['Creative', 'Open'],
    categoryId: 'cat_image',
    isPinned: false,
    createdAt: new Date('2024-12-15'),
    whatItIs: 'An open-source image generation model that can run locally.',
    capabilities: ['Local deployment', 'Customization', 'Fine-tuning'],
    bestFor: ['Custom workflows', 'Privacy-conscious users'],
    icon: 'SD',
    trend: [5, 6, 5, 7, 6, 7, 6],
    usage: 78,
    status: 'active',
    contentType: 'tool',
  },
  'tool_cursor': {
    id: 'tool_cursor',
    name: 'Cursor',
    url: 'https://cursor.sh',
    type: 'DEV',
    summary: 'AI-powered code editor with chat',
    tags: ['Dev', 'Prod'],
    categoryId: 'cat_dev',
    isPinned: true,
    createdAt: new Date('2024-12-15'),
    whatItIs: 'An AI-native code editor built from the ground up with AI features.',
    capabilities: ['AI chat', 'Code generation', 'Codebase understanding'],
    bestFor: ['AI-assisted development', 'Rapid prototyping'],
    icon: 'Cu',
    trend: [5, 6, 7, 8, 9, 9, 9],
    usage: 88,
    status: 'active',
    contentType: 'tool',
  },
  'tool_copilot': {
    id: 'tool_copilot',
    name: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    type: 'DEV',
    summary: 'AI code assistant integrated with IDEs',
    tags: ['Dev', 'Prod'],
    categoryId: 'cat_dev',
    isPinned: false,
    createdAt: new Date('2024-12-12'),
    whatItIs: 'An AI-powered code completion tool integrated into popular IDEs.',
    capabilities: ['Code completion', 'Suggestions', 'Documentation'],
    bestFor: ['Daily coding', 'Learning new languages'],
    icon: '⬡',
    trend: [6, 7, 7, 8, 8, 9, 9],
    usage: 91,
    status: 'active',
    contentType: 'tool',
  },
  'tool_notion': {
    id: 'tool_notion',
    name: 'Notion AI',
    url: 'https://notion.so',
    type: 'WRITING',
    summary: 'Writing & notes assistant in workspace',
    tags: ['Writing', 'Prod'],
    categoryId: 'cat_writing',
    isPinned: false,
    createdAt: new Date('2024-12-12'),
    whatItIs: 'AI features integrated into the Notion workspace.',
    capabilities: ['Writing assistance', 'Summarization', 'Translation'],
    bestFor: ['Note-taking', 'Documentation'],
    icon: 'N',
    trend: [5, 5, 6, 6, 7, 7, 7],
    usage: 74,
    status: 'active',
    contentType: 'tool',
  },
  'tool_jasper': {
    id: 'tool_jasper',
    name: 'Jasper AI',
    url: 'https://jasper.ai',
    type: 'WRITING',
    summary: 'Marketing content generation platform',
    tags: ['Writing', 'Prod'],
    categoryId: 'cat_writing',
    isPinned: false,
    createdAt: new Date('2024-12-12'),
    whatItIs: 'An AI writing platform focused on marketing content.',
    capabilities: ['Marketing copy', 'Blog posts', 'Social media'],
    bestFor: ['Marketing teams', 'Content creators'],
    icon: '○',
    trend: [4, 5, 4, 6, 5, 6, 5],
    usage: 72,
    status: 'active',
    contentType: 'tool',
  },
  'tool_perplexity': {
    id: 'tool_perplexity',
    name: 'Perplexity AI',
    url: 'https://perplexity.ai',
    type: 'RESEARCH',
    summary: 'Search & answer engine with citations',
    tags: ['Research', 'Prod'],
    categoryId: 'cat_research',
    isPinned: false,
    createdAt: new Date('2024-12-11'),
    whatItIs: 'An AI search engine that provides answers with cited sources.',
    capabilities: ['Cited answers', 'Real-time search', 'Pro search'],
    bestFor: ['Research', 'Fact-checking'],
    icon: '◇',
    trend: [3, 4, 5, 6, 7, 8, 9],
    usage: 76,
    status: 'active',
    contentType: 'tool',
  },
  'tool_huggingface': {
    id: 'tool_huggingface',
    name: 'Hugging Face',
    url: 'https://huggingface.co',
    type: 'DEV',
    summary: 'Model repository and ML platform',
    tags: ['Dev', 'Open'],
    categoryId: 'cat_dev',
    isPinned: false,
    createdAt: new Date('2024-12-11'),
    whatItIs: 'A platform for sharing and deploying ML models.',
    capabilities: ['Model hosting', 'Spaces', 'Datasets'],
    bestFor: ['ML development', 'Model discovery'],
    icon: '🤗',
    trend: [5, 6, 6, 7, 7, 8, 8],
    usage: 70,
    status: 'active',
    contentType: 'tool',
  },
  'tool_runway': {
    id: 'tool_runway',
    name: 'Runway ML',
    url: 'https://runwayml.com',
    type: 'VIDEO',
    summary: 'AI video tools for creators',
    tags: ['Creative', 'Prod'],
    categoryId: 'cat_video',
    isPinned: false,
    createdAt: new Date('2024-12-10'),
    whatItIs: 'A creative AI platform for video generation and editing.',
    capabilities: ['Text-to-video', 'Video editing', 'Gen-3 Alpha'],
    bestFor: ['Video creators', 'Filmmakers'],
    icon: 'R',
    trend: [4, 5, 6, 7, 7, 8, 8],
    usage: 69,
    status: 'active',
    contentType: 'tool',
  },
  'tool_elevenlabs': {
    id: 'tool_elevenlabs',
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io',
    type: 'AUDIO',
    summary: 'Realistic voice generation & cloning',
    tags: ['Creative', 'Audio'],
    categoryId: 'cat_creative',
    isPinned: false,
    createdAt: new Date('2024-12-10'),
    whatItIs: 'An AI voice platform for text-to-speech and voice cloning.',
    capabilities: ['Voice cloning', 'Text-to-speech', 'Multiple languages'],
    bestFor: ['Voiceovers', 'Audiobooks', 'Content creation'],
    icon: "'l",
    trend: [3, 4, 5, 6, 7, 8, 9],
    usage: 71,
    status: 'active',
    contentType: 'tool',
  },
  'tool_canva': {
    id: 'tool_canva',
    name: 'Canva AI',
    url: 'https://canva.com',
    type: 'CREATIVE',
    summary: 'Graphic design assistant with AI features',
    tags: ['Creative', 'Prod'],
    categoryId: 'cat_creative',
    isPinned: false,
    createdAt: new Date('2024-12-06'),
    whatItIs: 'A design platform with integrated AI features.',
    capabilities: ['Design generation', 'Image editing', 'Templates'],
    bestFor: ['Marketing', 'Social media'],
    icon: 'Ca',
    trend: [5, 6, 6, 7, 7, 8, 8],
    usage: 82,
    status: 'active',
    contentType: 'tool',
  },
  'tool_miro': {
    id: 'tool_miro',
    name: 'Miro AI',
    url: 'https://miro.com',
    type: 'CREATIVE',
    summary: 'Whiteboard collaboration with AI',
    tags: ['Prod', 'Int'],
    categoryId: 'cat_creative',
    isPinned: false,
    createdAt: new Date('2024-12-06'),
    whatItIs: 'A collaborative whiteboard platform with AI features.',
    capabilities: ['Brainstorming', 'Diagram generation', 'Summarization'],
    bestFor: ['Team collaboration', 'Planning'],
    icon: 'Mi',
    trend: [4, 5, 5, 6, 6, 7, 7],
    usage: 68,
    status: 'active',
    contentType: 'tool',
  },
  'tool_flux': {
    id: 'tool_flux',
    name: 'Flux',
    url: 'https://flux.ai',
    type: 'IMAGE',
    summary: 'Fast high-quality image generation',
    tags: ['Creative', 'Fast'],
    categoryId: 'cat_image',
    isPinned: false,
    createdAt: new Date('2024-12-05'),
    whatItIs: 'A fast, high-quality image generation model.',
    capabilities: ['Fast generation', 'High quality', 'API access'],
    bestFor: ['Production workflows', 'Speed-critical applications'],
    icon: 'Fl',
    trend: [2, 4, 6, 7, 8, 9, 9],
    usage: 73,
    status: 'active',
    contentType: 'tool',
  },
  'tool_pika': {
    id: 'tool_pika',
    name: 'Pika',
    url: 'https://pika.art',
    type: 'VIDEO',
    summary: 'AI video from text and images',
    tags: ['Creative', 'Gen'],
    categoryId: 'cat_video',
    isPinned: false,
    createdAt: new Date('2024-12-04'),
    whatItIs: 'An AI video generation tool.',
    capabilities: ['Text-to-video', 'Image-to-video', 'Video effects'],
    bestFor: ['Short videos', 'Social content'],
    icon: 'Pi',
    trend: [1, 2, 4, 5, 7, 8, 9],
    usage: 62,
    status: 'active',
    contentType: 'tool',
  },
  'tool_synthesia': {
    id: 'tool_synthesia',
    name: 'Synthesia',
    url: 'https://synthesia.io',
    type: 'VIDEO',
    summary: 'AI avatar video creation',
    tags: ['Avatar', 'Ent'],
    categoryId: 'cat_video',
    isPinned: false,
    createdAt: new Date('2024-12-03'),
    whatItIs: 'A platform for creating AI-powered avatar videos.',
    capabilities: ['AI avatars', 'Multi-language', 'Templates'],
    bestFor: ['Training videos', 'Corporate content'],
    icon: '◈',
    trend: [4, 4, 5, 5, 6, 6, 7],
    usage: 58,
    status: 'active',
    contentType: 'tool',
  },
  'tool_slackai': {
    id: 'tool_slackai',
    name: 'Slack AI',
    url: 'https://slack.com',
    type: 'CHATBOT',
    summary: 'Team communication intelligence',
    tags: ['Prod', 'Int'],
    categoryId: 'cat_chatbots',
    isPinned: false,
    createdAt: new Date('2024-12-02'),
    whatItIs: 'AI features integrated into Slack.',
    capabilities: ['Channel summaries', 'Thread replies', 'Search'],
    bestFor: ['Team communication', 'Knowledge discovery'],
    icon: '#',
    trend: [3, 4, 4, 5, 5, 6, 6],
    usage: 55,
    status: 'active',
    contentType: 'tool',
  },
};

// ============================================
// INITIAL COLLECTIONS
// ============================================

export const INITIAL_COLLECTIONS: Collection[] = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format date for display (MM/DD format like reference)
export const formatDate = (date: Date | number | string): string => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
};

// Check if date is within filter range
export const isWithinDateRange = (date: Date | number | string, filter: 'all' | 'today' | 'week' | 'month' | 'year'): boolean => {
  if (filter === 'all') return true;

  const d = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  switch (filter) {
    case 'today': return diffDays < 1;
    case 'week': return diffDays < 7;
    case 'month': return diffDays < 30;
    case 'year': return diffDays < 365;
    default: return true;
  }
};
