"use client";
import React, { useState, useEffect } from 'react';

const SubmitPromptForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    visibility: 'private',
    prompt: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setCatLoading(true);
        const r = await fetch('/api/categories', { cache: 'no-store' });
        const data = await r.json();
        setCategories(data?.categories || []);
      } catch {
        setCategories([]); // fallback to empty; UI will disable dropdown
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append('files', file));

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        body: data,
      });
      const responseData = await res.json();
      if (res.ok) {
        setMessage('Prompt and image submitted successfully!');
        setFormData({ title: '', category: '', visibility: 'private', prompt: '' });
        setFiles([]);
      } else {
        const errorMessage = responseData.error || `Submission failed with status ${res.status}`;
        setMessage(`Submission failed: ${errorMessage}`);
        console.error('Submission error:', responseData);
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      setMessage(`Error: ${errorMessage}`);
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121021] min-h-screen text-white font-sans py-16 px-4 sm:px-8 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white mb-4">Submit Your Prompt</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Share your best prompts and images for ChatGPT, Bard, Claude, or other LLMs with our community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1828] p-6 sm:p-8 rounded-2xl border border-[#2a273b]">
          <div className="flex items-center mb-6">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#8B5CF6] text-white rounded-full font-bold mr-3">1</span>
            <h2 className="text-xl font-bold">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                placeholder="Give your prompt a clear, descriptive title"
                className="w-full p-3 rounded-lg bg-[#24223A] border border-[#3e3b4a] focus:outline-none focus:border-[#8B5CF6] placeholder-gray-500"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                className="w-full p-3 rounded-lg bg-[#24223A] border border-[#3e3b4a] focus:outline-none focus:border-[#8B5CF6] text-gray-400"
                value={formData.category}
                onChange={handleInputChange}
                required
                disabled={catLoading || categories.length === 0}
              >
                <option value="">{catLoading ? "Loading categories..." : "Select a category..."}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-1">
              Visibility <span className="text-red-500">*</span>
            </label>
            <select
              id="visibility"
              className="w-full p-3 rounded-lg bg-[#24223A] border border-[#3e3b4a] focus:outline-none focus:border-[#8B5CF6] text-gray-400"
              value={formData.visibility}
              onChange={handleInputChange}
              required
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <hr className="border-t border-[#3e3b4a] my-8" />

          <div className="flex items-center mb-6">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#8B5CF6] text-white rounded-full font-bold mr-3">2</span>
            <h2 className="text-xl font-bold">Prompt Content</h2>
          </div>

          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
            The Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            id="prompt"
            rows="6"
            placeholder="Enter your prompt text here. Use {{VARIABLE}} for dynamic content"
            className="w-full p-3 rounded-lg bg-[#24223A] border border-[#3e3b4a] focus:outline-none focus:border-[#8B5CF6] placeholder-gray-500 resize-none"
            value={formData.prompt}
            onChange={handleInputChange}
            required
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            The actual prompt text that users will copy and use
          </p>

          <hr className="border-t border-[#3e3b4a] my-8" />

          <div>
            <div className="flex items-center mb-6">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[#8B5CF6] text-white rounded-full font-bold mr-3">3</span>
              <h2 className="text-xl font-bold">Photos and Videos</h2>
            </div>

            <label htmlFor="file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-[#3e3b4a] rounded-lg p-8 text-center cursor-pointer hover:border-[#8B5CF6] transition-colors duration-200">
              <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-gray-400 mb-1">Drag & drop files or <span className="text-[#8B5CF6] font-semibold">Browse</span></p>
              <p className="text-xs text-gray-500">Supported formats: JPG, PNG, GIF, MP4 (Max 10MB)</p>
              <input
                type="file"
                id="file-upload"
                name="files"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-10 rounded-md transition-colors duration-200 max-w-sm"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Prompt'}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-center">
              <p className={`text-sm ${message.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
export default SubmitPromptForm;