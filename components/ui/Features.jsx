"use client";

import React from 'react';
import { FaDatabase, FaRocket, FaShareAlt, FaFlask, FaUsers, FaArrowRight, FaCompressAlt } from 'react-icons/fa';

// Mock data for the features section
const features = [
  {
    icon: <FaDatabase className="text-[#a083f2] w-6 h-6" />,
    badge: 'MOST POPULAR',
    title: 'Prompt Database',
    description: 'Access 600+ professionally curated prompts for ChatGPT, Claude, Gemini, and more. Updated daily by our community.',
    linkText: 'Explore Database',
    link: '#',
  },
  {
    icon: <FaCompressAlt className="text-[#a083f2] w-6 h-6" />,
    badge: null,
    title: 'AI Humanizer',
    description: 'Transform AI text to sound naturally human',
    linkText: 'Try Now',
    link: '#',
  },
  {
    icon: <FaRocket className="text-[#a083f2] w-6 h-6" />,
    badge: null,
    title: 'Prompt Optimizer',
    description: 'Enhance prompts for better AI responses',
    linkText: 'Optimize',
    link: '#',
  },
];

const FeaturesSection = () => {
  return (
    <div className="bg-[#110e19] text-white py-16 px-6 sm:px-12">
      {/* Section Header */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold mb-2">Everything You Need</h2>
        <p className="text-gray-400">
          Powerful features designed for AI enthusiasts and professionals
        </p>
      </div>

      {/* Grid of feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <div key={index} className="relative bg-[#2a273b] p-6 rounded-lg flex flex-col justify-between border border-[#3e3b4a]">
            {feature.badge && (
              <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${feature.badge === 'NEW' ? 'bg-[#5939E8] text-white' : 'bg-[#e8b539] text-black'}`}>
                {feature.badge}
              </span>
            )}
            <div className="flex-grow">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 mb-6">{feature.description}</p>
            </div>
            <a href={feature.link} className="flex items-center text-[#a083f2] font-semibold hover:text-white transition-colors duration-200">
              {feature.linkText}
              <FaArrowRight className="ml-2" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
