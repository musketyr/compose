'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Editor } from '@/components/editor';
import { ToastContainer, showToast } from '@/components/toast';
import { SuggestionHighlight } from '@/components/suggestion-highlight';
import { Save, FileText, Trash2, Plus, Download, Copy, RefreshCw, Pencil, Check, ArrowLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Draft {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

interface Suggestion {
  id: string;
  original: string;
  suggested: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;
  
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editorElement, setEditorElement] = useState<HTMLElement | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastKnownUpdate = useRef<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Get token
  useEffect(() => {
    const savedToken = localStorage.getItem('scribe_token');
    if (savedToken) setToken(savedToken);
  }, []);

  // Load draft
  useEffect(() => {
    if (!token || !draftId) return;
    
    const loadDraft = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/drafts/${draftId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDraft(data);
          setTitle(data.title);
          setContent(data.content);
          lastKnownUpdate.current = data.updated_at;
          
          // Load suggestions
          const sugRes = await fetch(`/api/drafts/${draftId}/suggestions`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (sugRes.ok) {
            setSuggestions(await sugRes.json());
          }
        } else {
          showToast('Draft not found', 'warning');
          router.push('/');
        }
      } catch {
        showToast('Failed to load draft', 'warning');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDraft();
  }, [token, draftId, router]);

  // Find editor element for highlighting
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorContainerRef.current) {
        const proseMirror = editorContainerRef.current.querySelector('.ProseMirror');
        setEditorElement(proseMirror as HTMLElement);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  // Auto-save
  useEffect(() => {
    if (!content || !token || !draft) return;
    const timer = setTimeout(() => saveDraft(), 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title]);

  // Poll for external changes
  useEffect(() => {
    if (!token || !draftId) return;
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/drafts/${draftId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;
        
        const serverDraft = await res.json();
        if (lastKnownUpdate.current && serverDraft.updated_at !== lastKnownUpdate.current) {
          showToast('📝 Document updated! Click refresh to load.', 'info');
          
          // Also reload suggestions
          const sugRes = await fetch(`/api/drafts/${draftId}/suggestions`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (sugRes.ok) {
            const newSuggestions = await sugRes.json();
            if (JSON.stringify(newSuggestions) !== JSON.stringify(suggestions)) {
              setSuggestions(newSuggestions);
              const pending = newSuggestions.filter((s: Suggestion) => s.status === 'pending');
              if (pending.length > 0) {
                showToast(`💡 ${pending.length} new suggestion(s)!`, 'info');
              }
            }
          }
        }
        lastKnownUpdate.current = serverDraft.updated_at;
      } catch { /* ignore */ }
    };
    
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, draftId]);

  const saveDraft = useCallback(async () => {
    if (!content || !token || !draftId) return;
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      
      if (response.ok) {
        const savedDraft = await response.json();
        setDraft(savedDraft);
        lastKnownUpdate.current = savedDraft.updated_at;
      }
    } finally {
      setIsSaving(false);
    }
  }, [content, title, token, draftId]);

  const reloadDraft = async () => {
    if (!token || !draftId) return;
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data);
        setTitle(data.title);
        setContent(data.content);
        lastKnownUpdate.current = data.updated_at;
        
        const sugRes = await fetch(`/api/drafts/${draftId}/suggestions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (sugRes.ok) setSuggestions(await sugRes.json());
        
        showToast('✅ Reloaded!', 'success');
      }
    } catch {
      showToast('Failed to reload', 'warning');
    }
  };

  const acceptSuggestion = async (suggestion: Suggestion) => {
    if (!content) return;
    
    // Apply text replacement
    const contentStr = JSON.stringify(content);
    const newContentStr = contentStr.replace(
      new RegExp(escapeRegExp(suggestion.original), 'g'),
      suggestion.suggested
    );
    setContent(JSON.parse(newContentStr));
    
    // Update status
    if (token) {
      await fetch(`/api/drafts/${draftId}/suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
    }
    
    setSuggestions(prev => prev.map(s => 
      s.id === suggestion.id ? { ...s, status: 'accepted' } : s
    ));
    showToast('✅ Applied!', 'success');
  };

  const rejectSuggestion = async (suggestion: Suggestion) => {
    if (token) {
      await fetch(`/api/drafts/${draftId}/suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
    }
    
    setSuggestions(prev => prev.map(s => 
      s.id === suggestion.id ? { ...s, status: 'rejected' } : s
    ));
    showToast('Dismissed', 'info');
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
    showToast('HTML copied!', 'success');
    setShowExport(false);
  };

  const exportToMarkdown = () => {
    let md = `# ${title}\n\n`;
    if (content?.content) {
      content.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          md += `${text}\n\n`;
        } else if (node.type === 'heading') {
          const text = node.content?.map((c: any) => c.text).join('') || '';
          md += `${'#'.repeat(node.attrs.level)} ${text}\n\n`;
        }
      });
    }
    navigator.clipboard.writeText(md);
    showToast('Markdown copied!', 'success');
    setShowExport(false);
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

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
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3">
        {/* Top row: back, brand, actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 p-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 shrink-0">✍️ Scribe</h1>
            
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-orange-600 bg-orange-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0">
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{pendingCount} suggestion{pendingCount > 1 ? 's' : ''}</span>
                <span className="sm:hidden">{pendingCount}</span>
              </span>
            )}
            
            {isSaving && <span className="text-xs text-gray-400 shrink-0">Saving...</span>}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 sm:gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Export</span>
              </button>
              
              {showExport && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  <button onClick={exportToHtml} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> HTML
                  </button>
                  <button onClick={exportToMarkdown} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Markdown
                  </button>
                </div>
              )}
            </div>
            
            <button onClick={reloadDraft} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="p-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 sm:gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
        
        {/* Title row - separate line for breathing room */}
        <div className="mt-1.5 sm:mt-2 pl-8 sm:pl-10">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="text-base sm:text-lg font-medium px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                autoFocus
              />
              <button onClick={() => setIsEditingTitle(false)} className="text-green-600 shrink-0">
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsEditingTitle(true);
                setTimeout(() => titleInputRef.current?.select(), 0);
              }}
              className="flex items-center gap-2 text-base sm:text-lg font-medium text-gray-800 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-100 max-w-full truncate"
            >
              <span className="truncate">{title || 'Untitled'}</span>
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            </button>
          )}
        </div>
      </header>

      {/* Editor with inline suggestions */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto relative" ref={editorContainerRef}>
          <Editor content={content} onChange={setContent} />
          
          <SuggestionHighlight
            editorElement={editorElement}
            suggestions={suggestions}
            onAccept={acceptSuggestion}
            onReject={rejectSuggestion}
          />
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
