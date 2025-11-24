"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PromptCard from '@/components/PromptCard';
import { Loader2 } from 'lucide-react';

export default function PrivatePromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/prompts/privateprompt', {
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.push('/user/login');
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to fetch prompts');
          return;
        }

        const data = await res.json();
        setPrompts(data.prompts || []);
      } catch (err) {
        console.error('Error fetching prompts:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121021] flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121021] text-white flex justify-center items-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/user/login')}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7D49E0] rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">My Private Prompts</h1>
          <p className="text-gray-400">
            {prompts.length === 0
              ? 'You don\'t have any private prompts yet.'
              : `You have ${prompts.length} private prompt${prompts.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">Start creating private prompts to see them here!</p>
            <a
              href="/create-prompt/submitprompt"
              className="inline-block px-6 py-3 bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium rounded-lg transition-colors"
            >
              Create a Private Prompt
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt._id}
                title={prompt.title}
                category={prompt.category}
                visibility={prompt.visibility}
                promptSnippet={prompt.promptContent?.substring(0, 100) || ''}
                fullPrompt={prompt.promptContent || ''}
                imageUrl={prompt.media?.[0] || prompt.imageUrl}
                authorName={prompt.owner?.name || prompt.owner?.username || 'Unknown'}
                authorImageUrl={prompt.owner?.imageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
