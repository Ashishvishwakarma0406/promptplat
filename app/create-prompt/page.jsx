
"use client";

import React from 'react';

// Replaced `next/link` with standard `a` tags and `react-icons` with inline SVGs
// to resolve compilation errors. This ensures the component is self-contained.

const ContentCard = ({ icon, title, description, buttonText, buttonLink }) => (
    <div className="bg-[#1a1828] p-8 rounded-2xl border border-[#2a273b] hover:border-[#8B5CF6] transition-colors duration-300 transform hover:-translate-y-2">
        <div className="flex items-center justify-center w-16 h-16 bg-[#2a273b] rounded-full mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        <a
            href={buttonLink}
            className="w-full text-center bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium py-4 px-4 rounded-md transition-colors duration-200"
        >
            {buttonText}
        </a>
    </div>
);

const ShareContent = () => {
    // Inline SVG icons to replace react-icons/fa
    const faFileAlt = (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#8B5CF6]" viewBox="0 0 512 512" fill="currentColor">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zM248 120a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
        </svg>
    );
    const faImage = (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#8B5CF6]" viewBox="0 0 512 512" fill="currentColor">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM128 224a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM352 96l-71.1 94.8c-10.6 14.2-30.8 14.2-41.4 0L128 96c-11.4-15.2-32.5-16.1-44.8-2.3S64 123.6 64 144v224c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V144c0-20.4-11.3-39.7-29.5-49.1s-40.4-8.8-54.5 2.5L352 96z" />
        </svg>
    );

    return (
        <section className="bg-[#121021] py-20 px-4 sm:px-8">
            <div className="container mx-auto max-w-7xl text-center">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                    Share Your Content
                </h2>
                <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
                    Join our community by contributing your prompts, images, GPTs, or AI tools. Choose your submission type below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    <ContentCard
                        icon={faFileAlt}
                        title="Submit a Prompt"
                        description="Share your best prompts for ChatGPT, Bard, Claude, or other LLMs with our community."
                        buttonText="Submit Prompt"
                        buttonLink="/create-prompt/submitprompt"
                    />
                    <ContentCard
                        icon={faImage}
                        title="Submit Prompt with Output"
                        description="Share your AI-generated images along with the prompts used to create them."
                        buttonText="Submit Image"
                        buttonLink="/submit-image"
                    />
                </div>
            </div>
        </section>
    );
};

export default ShareContent;
