import { storage } from './storage';

const INITIAL_CATEGORIES = [
  { name: 'Chatbots & Assistants', collapsed: false, toolIds: [] },
  { name: 'Image & Creative', collapsed: false, toolIds: [] },
  { name: 'Development & Agents', collapsed: false, toolIds: [] },
];

const INITIAL_TOOLS = [
  {
    name: 'OpenAI ChatGPT',
    url: 'https://chat.openai.com',
    type: 'Chatbot',
    summary: 'Advanced AI language model for conversation, coding, and content generation.',
    tags: ['LLM', 'Productivity', 'General'],
    categoryId: '',
    isPinned: true,
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
  {
    name: 'ClickUp Chat',
    url: 'https://clickup.com/features/chat',
    type: 'Productivity',
    summary: 'AI-integrated chat within ClickUp for task management.',
    tags: ['Project Management', 'Collaboration'],
    categoryId: '',
    isPinned: true,
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
  {
    name: 'Google Labs CC',
    url: 'https://labs.google',
    type: 'Creative Suite',
    summary: 'Experimental AI tools and features from Google.',
    tags: ['Experimental', 'Google', 'Creative'],
    categoryId: '',
    isPinned: false,
    whatItIs: 'An experimental playground where Google tests early-stage AI projects and features before wider release.',
    capabilities: [
      'Access early-access AI experiments',
      'Test new generative AI features for creative work',
      'Provide feedback directly to Google engineering teams'
    ],
    bestFor: [
      'Early adopters wanting to test new tech',
      'Exploring experimental creative tools',
      'Tracking Google\'s AI development roadmap'
    ]
  },
  {
    name: 'REimagineHome.ai',
    url: 'https://reimaginehome.ai',
    type: 'Design Tool',
    summary: 'AI-powered interior design and virtual staging platform.',
    tags: ['Real Estate', 'Design', '3D'],
    categoryId: '',
    isPinned: false,
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
  {
    name: 'Simular AI',
    url: 'https://simular.ai',
    type: 'Simulation',
    summary: 'AI platform for creating realistic simulations.',
    tags: ['Simulation', 'Data', 'Modeling'],
    categoryId: '',
    isPinned: false,
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
  {
    name: 'Adeptly',
    url: 'https://adeptly.ai',
    type: 'Agent Platform',
    summary: 'Build and deploy AI agents for various tasks.',
    tags: ['Agents', 'Automation', 'No-code'],
    categoryId: '',
    isPinned: false,
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
  {
    name: 'PUNKU.ai',
    url: 'https://punku.ai',
    type: 'Developer Tool',
    summary: 'AI-powered development assistant.',
    tags: ['Coding', 'Developer Experience'],
    categoryId: '',
    isPinned: false,
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
];

async function seed() {
  try {
    console.log('Starting seed...');
    
    const existingCategories = await storage.getAllCategories();
    const existingTools = await storage.getAllTools();
    
    if (existingCategories.length > 0 || existingTools.length > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    const createdCategories = [];
    for (const cat of INITIAL_CATEGORIES) {
      const created = await storage.createCategory(cat);
      createdCategories.push(created);
      console.log(`Created category: ${created.name}`);
    }

    const categoryMap: Record<string, string> = {
      'Chatbots & Assistants': createdCategories[0].id,
      'Image & Creative': createdCategories[1].id,
      'Development & Agents': createdCategories[2].id,
    };

    for (const tool of INITIAL_TOOLS) {
      let categoryId = categoryMap['Chatbots & Assistants'];
      
      if (tool.type.includes('Chat') || tool.type.includes('Productivity') || tool.type.includes('Chatbot')) {
        categoryId = categoryMap['Chatbots & Assistants'];
      } else if (tool.type.includes('Creative') || tool.type.includes('Design') || tool.type.includes('Simulation')) {
        categoryId = categoryMap['Image & Creative'];
      } else if (tool.type.includes('Agent') || tool.type.includes('Developer')) {
        categoryId = categoryMap['Development & Agents'];
      }

      const created = await storage.createTool({ ...tool, categoryId });
      console.log(`Created tool: ${created.name}`);
      
      const category = await storage.getCategory(categoryId);
      if (category) {
        await storage.updateCategory(categoryId, {
          toolIds: [...category.toolIds, created.id]
        });
      }
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

seed();
