// components\shared\Footer.jsx
"use client";

import React from 'react';
import Image from 'next/image';
import { FaTwitter, FaYoutube, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-[#1a1828] text-white py-12 px-6 sm:px-12">
            <div className="container mx-auto">
                {/* Main content grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center mb-4">
                            <Image
                                src="/promptlogo.png"
                                alt="Prompt Index Logo"
                                width={32}
                                height={32}
                            />
                            <span className="text-xl font-bold ml-2">The Prompt Index</span>
                        </div>
                        <p className="text-sm text-gray-400 ">
                            The world's largest open-source library of prompts, GPTs, and AI tools. Created by and
                        </p>
                        <p className="text-sm text-gray-400 mb-6">for the prompt engineering community.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-[#2a273b] rounded-full text-gray-400 hover:text-white transition-colors duration-200">
                                <FaTwitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 bg-[#2a273b] rounded-full text-gray-400 hover:text-white transition-colors duration-200">
                                <FaYoutube className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 bg-[#2a273b] rounded-full text-gray-400 hover:text-white transition-colors duration-200">
                                <FaLinkedinIn className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Platform</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white">Prompt Database</a></li>
                            <li><a href="#" className="hover:text-white">GPTs</a></li>
                            <li><a href="#" className="hover:text-white">Image Prompts</a></li>
                            <li><a href="#" className="hover:text-white">AI Toolbox</a></li>
                        </ul>
                    </div>

                    {/* Community Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Community</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white">Submit Content</a></li>
                            <li><a href="#" className="hover:text-white">Leaderboard</a></li>
                            <li><a href="#" className="hover:text-white">Telegram Group</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                        </ul>
                    </div>
                </div>

                <hr className="border-t border-[#3e3b4a] my-8" />

                {/* Copyright and Legal Links */}
                <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-4 sm:space-y-0">
                    <span>© 2025 The Prompt Index. All rights reserved.</span>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="/legal" className="hover:text-white">Terms of Service</a>
                        <a href="#" className="hover:text-white">Cookie Preferences</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
