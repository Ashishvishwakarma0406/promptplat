"use client";

import React from 'react';
import { FaHeart, FaArrowRight } from 'react-icons/fa';

// Mock data for the trending prompts
const trendingPrompts = [
  {
    id: 1,
    model: 'GPT-4',
    likes: 151,
    title: 'Competitive Intelligence Claude 4 Prompt',
    description: 'USER: You are a competitive intelligence expert who uncovers what companies are actually building....',
    author: 'Summers',
  },
  {
    id: 2,
    model: 'GPT-4',
    likes: 131,
    title: 'Expert Conductor — Reasoning Guide for Grok',
    description: 'SYSTEM: You are a conductor of expertise, bringing together the world’s foremost minds to collaborat...',
    author: 'Sumer',
  },
  {
    id: 3,
    model: 'GPT-4',
    likes: 124,
    title: 'Force GPT-4.5 to reason',
    description: 'First, think deeply for five minutes (at a minimum — if after five minutes, you still don’t have the...',
    author: '@mattshumer_',
  },
  {
    id: 4,
    model: 'GPT-4',
    likes: 122,
    title: 'AI Course Architect: 5-Part Outline Generator',
    description: 'Your primary objective is to function as an expert instructional designer and curriculum architect...',
    author: 'marcosdecastro',
  },
  {
    id: 5,
    model: 'GPT-4',
    likes: 122,
    title: 'Note Omni-Architect',
    description: 'You are Note Omni-Architect, a sharp, organized, and context-aware AI designed to help users captu...',
    author: 'Zacie Productions',
  },
  {
    id: 6,
    model: 'GPT-4',
    likes: 121,
    title: 'o3 Maximum Reasoning',
    description: 'SYSTEM: Ultra-deep thinking mode. Greater rigor, attention to detail, and multi-angle verification....',
    author: '@mattshumer_',
  },
];

const TrendingPrompts = () => {
  return (
    <div className="bg-[#110e19] text-white p-6 sm:p-12">
      {/* Section header */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold">Trending Prompts</h2>
        <a href="#" className="flex items-center text-sm sm:text-base text-[#8a68e8] font-semibold transition-colors duration-200 hover:text-white">
          View All
          <FaArrowRight className="ml-2" />
        </a>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {trendingPrompts.map((prompt) => (
          <div key={prompt.id} className="bg-[#2a273b] p-6 rounded-md flex flex-col justify-between border border-[#3e3b4a]">
            {/* Top row with badge and likes */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-white bg-[#5939E8] px-2 py-1 rounded-sm">
                {prompt.model}
              </span>
              <div className="flex items-center text-gray-400">
                <FaHeart className="text-purple-400 mr-1" />
                <span className="text-sm">{prompt.likes}</span>
              </div>
            </div>

            {/* Title and Description */}
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-white mb-2">{prompt.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{prompt.description}</p>
            </div>

            {/* Bottom row with author and view link */}
            <div className="flex justify-between items-center mt-auto">
              <span className="text-sm text-[#8a68e8]">{prompt.author}</span>
              <a href="#" className="flex items-center text-sm text-[#8a68e8] transition-colors duration-200 hover:text-white">
                View
                <FaArrowRight className="ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPrompts;
