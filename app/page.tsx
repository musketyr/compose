'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, showToast } from '@/components/toast';
import { FileText, Trash2, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Draft {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  // Load token and drafts
  useEffect(() => {
    const savedToken = localStorage.getItem('scribe_token');
    if (savedToken) {
      setToken(savedToken);
      loadDrafts(savedToken);
    } else {
      setIsLoading(false);
      setShowTokenInput(true);
    }
  }, []);

  const loadDrafts = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drafts', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
        
        // If there's a recent draft, redirect to it
        if (data.length > 0) {
          router.push(`/drafts/${data[0].id}`);
          return;
        }
      } else {
        showToast('Invalid token', 'warning');
        setShowTokenInput(true);
      }
    } catch {
      showToast('Failed to load drafts', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('scribe_token', tokenInput.trim());
      setToken(tokenInput.trim());
      setShowTokenInput(false);
      loadDrafts(tokenInput.trim());
    }
  };

  const createNewDraft = async () => {
    if (!token) return;
    
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Untitled',
          content: { type: 'doc', content: [{ type: 'paragraph' }] },
        }),
      });
      
      if (res.ok) {
        const newDraft = await res.json();
        router.push(`/drafts/${newDraft.id}`);
      }
    } catch {
      showToast('Failed to create draft', 'warning');
    }
  };

  const deleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this draft?')) return;
    
    if (token) {
      await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
    setDrafts(prev => prev.filter(d => d.id !== id));
    showToast('Draft deleted', 'info');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">✍️ Scribe</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={createNewDraft}
              disabled={!token}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Draft
            </button>
          </div>
        </div>
      </header>

      {/* Token Input */}
      {showTokenInput && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token (from /api/setup)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="scribe_..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={saveToken}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {drafts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600 mb-2">No drafts yet</h2>
              <p className="text-gray-400 mb-6">Create your first draft to get started</p>
              <button
                onClick={createNewDraft}
                disabled={!token}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Draft
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => router.push(`/drafts/${draft.id}`)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {draft.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Last edited {new Date(draft.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteDraft(draft.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}
