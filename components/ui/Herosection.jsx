"use client";

import React from "react";
import Link from "next/link";
import { FaBookOpen, FaWrench } from "react-icons/fa";

const HeroSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100vh-72px)] text-center text-white bg-[#110e19] p-4">
      {/* Grid background pattern */}
      <div className="absolute inset-0 z-0 bg-grid-lines opacity-20"></div>

      {/* Hero content container */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {/* Top badge */}
        <span className="mb-6 px-4 py-1 text-sm font-medium tracking-wide text-[#a083f2] bg-[#221e2c] border border-[#3e3b4a] rounded-full">
          #1 AI Resource Hub
        </span>

        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          The World's Best
          <br />
          <span className="text-[#a083f2]">AI Prompt Database</span>
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mb-12">
          600+ curated prompts, powerful AI tools, and an active community of
          10,000+ prompt engineers. Everything you need to master AI in one place.
        </p>

        {/* Stats section */}
        <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-12 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">600+</span>
            <span className="text-sm text-gray-400 uppercase">Prompts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">15+</span>
            <span className="text-sm text-gray-400 uppercase">AI Tools</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">10K+</span>
            <span className="text-sm text-gray-400 uppercase">Users</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">

          {/* Browse Prompts */}
          <Link href="/public-prompts">
            <button className="flex items-center justify-center px-8 py-3 font-semibold text-lg bg-[#a083f2] text-white rounded-md transition-transform hover:scale-105 duration-200">
              <FaBookOpen className="mr-3" />
              Browse Prompts
            </button>
          </Link>

          {/* AI Humanizer */}
          <Link href="/ai/humanizer">
            <button className="flex items-center justify-center px-8 py-3 font-semibold text-lg bg-[#2a273b] border border-[#3e3b4a] text-white rounded-md transition-transform hover:scale-105 duration-200">
              <FaWrench className="mr-3" />
              AI Humanizer
            </button>
          </Link>

          {/* Prompt Rephraser */}
          <Link href="/ai/rephraser">
            <button className="flex items-center justify-center px-8 py-3 font-semibold text-lg bg-[#a083f2] text-white rounded-md transition-transform hover:scale-105 duration-200">
              <FaBookOpen className="mr-3" />
              Prompt Rephraser
            </button>
          </Link>
        </div>
      </div>

      {/* Custom CSS for the grid pattern */}
      <style jsx>{`
        .bg-grid-lines {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
