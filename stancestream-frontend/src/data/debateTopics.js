// The eight topics the arena offers. `stanceKey` is the key the backend stores
// stance values under (topicToStanceKey in ../messageGenerationCore.js).
export const BASE_DEBATE_TOPICS = [
    { id: 'climate', name: 'Climate Policy', description: 'Environmental regulations and green energy', icon: 'climate', stanceKey: 'climate_policy' },
    { id: 'ai', name: 'AI Regulation', description: 'Artificial intelligence governance and ethics', icon: 'ai', stanceKey: 'ai_policy' },
    { id: 'healthcare', name: 'Healthcare Reform', description: 'Universal healthcare and medical access', icon: 'healthcare', stanceKey: 'healthcare_policy' },
    { id: 'immigration', name: 'Immigration Policy', description: 'Border security and refugee assistance', icon: 'immigration', stanceKey: 'immigration_policy' },
    { id: 'education', name: 'Education Reform', description: 'Public education and student debt', icon: 'education', stanceKey: 'education_policy' },
    { id: 'taxation', name: 'Tax Policy', description: 'Progressive taxation and wealth redistribution', icon: 'taxation', stanceKey: 'tax_policy' },
    { id: 'privacy', name: 'Digital Privacy', description: 'Data protection and surveillance', icon: 'privacy', stanceKey: 'privacy_policy' },
    { id: 'space', name: 'Space Exploration', description: 'Space colonization and research funding', icon: 'space', stanceKey: 'space_policy' },
];
