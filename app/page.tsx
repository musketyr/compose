'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@/components/editor';
import { Chat } from '@/components/chat';
import { Save, FileText, Trash2, Plus, Download, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Draft {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [token, setToken] = useState<string>('');
  const [showExport, setShowExport] = useState(false);

  // Load token and drafts
  useEffect(() => {
    const savedToken = localStorage.getItem('scribe_token');
    if (savedToken) {
      setToken(savedToken);
      // Load drafts from API
      fetch('/api/drafts', {
        headers: { 'Authorization': `Bearer ${savedToken}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then((serverDrafts) => {
          setDrafts(serverDrafts);
          // Auto-load the most recent draft
          if (serverDrafts.length > 0 && !currentDraft) {
            const latest = serverDrafts[0];
            setCurrentDraft(latest);
            setTitle(latest.title);
            setContent(latest.content);
          }
        })
        .catch(() => {
          // Fallback to localStorage
          const savedDrafts = localStorage.getItem('scribe_drafts');
          if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
        });
    } else {
      // No token - use localStorage
      const savedDrafts = localStorage.getItem('scribe_drafts');
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!content || !token) return;
    
    const timer = setTimeout(() => {
      saveDraft();
    }, 1500); // Save 1.5s after last change
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, token]);

  const saveDraft = useCallback(async () => {
    if (!content) return;
    
    setIsSaving(true);
    
    try {
      // If we have an API token, save to backend
      if (token) {
        const isUpdate = currentDraft?.id && !currentDraft.id.startsWith('draft-');
        const url = isUpdate 
          ? `/api/drafts/${currentDraft.id}` 
          : '/api/drafts';
        
        const response = await fetch(url, {
          method: isUpdate ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        });
        
        if (response.ok) {
          const savedDraft = await response.json();
          setCurrentDraft(savedDraft);
          
          // Refresh drafts list
          const listResponse = await fetch('/api/drafts', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (listResponse.ok) {
            setDrafts(await listResponse.json());
          }
          return;
        }
      }
      
      // Fallback to localStorage
      const draft: Draft = {
        id: currentDraft?.id || `draft-${Date.now()}`,
        title,
        content,
        created_at: currentDraft?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedDrafts = drafts.filter(d => d.id !== draft.id);
      updatedDrafts.unshift(draft);
      
      setDrafts(updatedDrafts);
      setCurrentDraft(draft);
      localStorage.setItem('scribe_drafts', JSON.stringify(updatedDrafts));
    } finally {
      setIsSaving(false);
    }
  }, [content, title, currentDraft, drafts, token]);

  const loadDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setTitle(draft.title);
    setContent(draft.content);
    setShowDrafts(false);
  };

  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id);
    setDrafts(updatedDrafts);
    localStorage.setItem('scribe_drafts', JSON.stringify(updatedDrafts));
    
    if (currentDraft?.id === id) {
      setCurrentDraft(null);
      setTitle('Untitled');
      setContent(null);
    }
  };

  const newDraft = () => {
    setCurrentDraft(null);
    setTitle('Untitled');
    setContent({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
    setShowDrafts(false);
  };

  const exportToHtml = () => {
    // Simple conversion to HTML (TipTap has better built-in methods)
    let html = `<h1>${title}</h1>\n`;
    
    if (content?.content) {
      content.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          html += `<p>${text}</p>\n`;
        } else if (node.type === 'heading') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          html += `<h${node.attrs.level}>${text}</h${node.attrs.level}>\n`;
        }
      });
    }
    
    navigator.clipboard.writeText(html);
    alert('HTML copied to clipboard!');
  };

  const exportToMarkdown = () => {
    let markdown = `# ${title}\n\n`;
    
    if (content?.content) {
      content.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          markdown += `${text}\n\n`;
        } else if (node.type === 'heading') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          markdown += `${'#'.repeat(node.attrs.level)} ${text}\n\n`;
        }
      });
    }
    
    navigator.clipboard.writeText(markdown);
    alert('Markdown copied to clipboard!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">✍️ Scribe</h1>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Untitled"
            />
            {isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Drafts
            </button>
            
            <button
              onClick={newDraft}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
            
            <button
              onClick={() => setShowExport(!showExport)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Export Menu */}
      {showExport && (
        <div className="absolute right-6 top-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
          <button
            onClick={exportToHtml}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy as HTML
          </button>
          <button
            onClick={exportToMarkdown}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy as Markdown
          </button>
        </div>
      )}

      {/* Drafts Sidebar */}
      {showDrafts && (
        <div className="absolute left-6 top-20 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Your Drafts</h3>
          </div>
          {drafts.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No drafts yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 cursor-pointer flex items-start justify-between gap-2',
                    currentDraft?.id === draft.id && 'bg-blue-50'
                  )}
                  onClick={() => loadDraft(draft)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{draft.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this draft?')) {
                        deleteDraft(draft.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor (Left) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Editor
              content={content}
              onChange={setContent}
            />
          </div>
        </div>

        {/* Chat (Right) */}
        <div className="w-96 flex-shrink-0">
          <Chat editorContent={content} />
        </div>
      </div>
    </div>
  );
}
