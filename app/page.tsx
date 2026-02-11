'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@/components/editor';
import { ToastContainer, showToast } from '@/components/toast';
import { Save, FileText, Trash2, Plus, Download, Copy, RefreshCw, Pencil, Check } from 'lucide-react';
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
  const [token, setToken] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load token and drafts
  useEffect(() => {
    const savedToken = localStorage.getItem('scribe_token');
    if (savedToken) {
      setToken(savedToken);
      fetch('/api/drafts', {
        headers: { 'Authorization': `Bearer ${savedToken}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then((serverDrafts) => {
          setDrafts(serverDrafts);
          if (serverDrafts.length > 0 && !currentDraft) {
            const latest = serverDrafts[0];
            setCurrentDraft(latest);
            setTitle(latest.title);
            setContent(latest.content);
          }
        })
        .catch(() => {
          const savedDrafts = localStorage.getItem('scribe_drafts');
          if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
        });
    } else {
      const savedDrafts = localStorage.getItem('scribe_drafts');
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!content || !token) return;
    const timer = setTimeout(() => saveDraft(), 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, token]);

  // Track last known update time for external change detection
  const lastKnownUpdate = useRef<string | null>(null);
  
  // Poll for external changes every 5 seconds
  useEffect(() => {
    if (!token || !currentDraft?.id || currentDraft.id.startsWith('draft-')) return;
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/drafts/${currentDraft.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;
        
        const serverDraft = await res.json();
        if (!lastKnownUpdate.current) {
          lastKnownUpdate.current = serverDraft.updated_at;
          return;
        }
        if (serverDraft.updated_at !== lastKnownUpdate.current) {
          lastKnownUpdate.current = serverDraft.updated_at;
          showToast('📝 Document updated externally! Click refresh to load changes.', 'info');
        }
      } catch { /* ignore */ }
    };
    
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [token, currentDraft?.id]);

  const saveDraft = useCallback(async () => {
    if (!content) return;
    setIsSaving(true);
    
    try {
      if (token) {
        const isUpdate = currentDraft?.id && !currentDraft.id.startsWith('draft-');
        const response = await fetch(
          isUpdate ? `/api/drafts/${currentDraft.id}` : '/api/drafts',
          {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title, content }),
          }
        );
        
        if (response.ok) {
          const savedDraft = await response.json();
          setCurrentDraft(savedDraft);
          lastKnownUpdate.current = savedDraft.updated_at;
          const listResponse = await fetch('/api/drafts', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (listResponse.ok) setDrafts(await listResponse.json());
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

  const reloadCurrentDraft = async () => {
    if (!token || !currentDraft?.id || currentDraft.id.startsWith('draft-')) return;
    try {
      const res = await fetch(`/api/drafts/${currentDraft.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const serverDraft = await res.json();
      setCurrentDraft(serverDraft);
      setTitle(serverDraft.title);
      setContent(serverDraft.content);
      lastKnownUpdate.current = serverDraft.updated_at;
      showToast('✅ Document reloaded!', 'success');
    } catch {
      showToast('Failed to reload document', 'warning');
    }
  };

  const loadDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setTitle(draft.title);
    setContent(draft.content);
    lastKnownUpdate.current = draft.updated_at;
  };

  const deleteDraft = async (id: string) => {
    if (token && !id.startsWith('draft-')) {
      await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
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
    setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
    lastKnownUpdate.current = null;
  };

  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const finishEditingTitle = () => {
    setIsEditingTitle(false);
  };

  const exportToHtml = () => {
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
    showToast('HTML copied to clipboard!', 'success');
    setShowExport(false);
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
    showToast('Markdown copied to clipboard!', 'success');
    setShowExport(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">✍️ Scribe</h1>
            
            {/* Editable Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={finishEditingTitle}
                  onKeyDown={(e) => e.key === 'Enter' && finishEditingTitle()}
                  className="text-lg font-medium px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Untitled"
                />
                <button onClick={finishEditingTitle} className="text-green-600 hover:text-green-700">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditingTitle}
                className="flex items-center gap-2 text-lg font-medium text-gray-800 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                {title || 'Untitled'}
                <Pencil className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            {isSaving && <span className="text-sm text-gray-400">Saving...</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={newDraft}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              {showExport && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  <button
                    onClick={exportToHtml}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy as HTML
                  </button>
                  <button
                    onClick={exportToMarkdown}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy as Markdown
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={reloadCurrentDraft}
              disabled={!currentDraft?.id || currentDraft.id.startsWith('draft-')}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
              title="Reload from server"
            >
              <RefreshCw className="w-4 h-4" />
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <Editor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Drafts Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Drafts
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No drafts yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={cn(
                      'p-3 hover:bg-gray-50 cursor-pointer flex items-start justify-between gap-2 transition-colors',
                      currentDraft?.id === draft.id && 'bg-blue-50 border-l-2 border-blue-500'
                    )}
                    onClick={() => loadDraft(draft)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {draft.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(draft.updated_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this draft?')) deleteDraft(draft.id);
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}
