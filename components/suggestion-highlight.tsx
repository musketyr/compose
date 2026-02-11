'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Suggestion {
  id: string;
  original: string;
  suggested: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface SuggestionHighlightProps {
  editorElement: HTMLElement | null;
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
}

export function SuggestionHighlight({ 
  editorElement, 
  suggestions, 
  onAccept, 
  onReject 
}: SuggestionHighlightProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Apply highlights directly to the editor content using CSS
  useEffect(() => {
    if (!editorElement) return;

    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    
    // Remove old highlights
    editorElement.querySelectorAll('.suggestion-highlight').forEach(el => {
      const text = el.textContent || '';
      el.replaceWith(document.createTextNode(text));
    });

    // Apply new highlights
    const walker = document.createTreeWalker(
      editorElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToReplace: { node: Text; suggestion: Suggestion; start: number; end: number }[] = [];
    
    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const text = textNode.textContent || '';
      
      for (const suggestion of pendingSuggestions) {
        const index = text.indexOf(suggestion.original);
        if (index !== -1) {
          nodesToReplace.push({
            node: textNode,
            suggestion,
            start: index,
            end: index + suggestion.original.length,
          });
          break; // Only one highlight per text node for simplicity
        }
      }
    }

    // Apply replacements (in reverse order to maintain positions)
    for (const { node, suggestion, start, end } of nodesToReplace.reverse()) {
      const text = node.textContent || '';
      const before = text.slice(0, start);
      const match = text.slice(start, end);
      const after = text.slice(end);

      const span = document.createElement('span');
      span.className = 'suggestion-highlight bg-yellow-200 cursor-pointer hover:bg-yellow-300 px-0.5 rounded border-b-2 border-yellow-400';
      span.textContent = match;
      span.dataset.suggestionId = suggestion.id;
      span.title = `→ ${suggestion.suggested}`;
      
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveSuggestion(suggestion);
        const rect = span.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      });

      const fragment = document.createDocumentFragment();
      if (before) fragment.appendChild(document.createTextNode(before));
      fragment.appendChild(span);
      if (after) fragment.appendChild(document.createTextNode(after));
      
      node.parentNode?.replaceChild(fragment, node);
    }

    // Cleanup on unmount
    return () => {
      editorElement.querySelectorAll('.suggestion-highlight').forEach(el => {
        const text = el.textContent || '';
        el.replaceWith(document.createTextNode(text));
      });
    };
  }, [editorElement, suggestions]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveSuggestion(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!activeSuggestion) return null;

  return createPortal(
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-[300px] max-w-[400px]"
      style={{
        top: popoverPos.top,
        left: Math.min(popoverPos.left, window.innerWidth - 420),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-3 mb-4">
        <div>
          <span className="text-xs text-gray-400 block mb-1">Original:</span>
          <span className="text-sm text-red-600 line-through bg-red-50 px-2 py-1 rounded block">
            {activeSuggestion.original}
          </span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-1">Suggested:</span>
          <span className="text-sm text-green-700 font-medium bg-green-50 px-2 py-1 rounded block">
            {activeSuggestion.suggested}
          </span>
        </div>
        {activeSuggestion.reason && (
          <p className="text-xs text-gray-500 italic bg-gray-50 px-2 py-1 rounded">
            💡 {activeSuggestion.reason}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => {
            onAccept(activeSuggestion);
            setActiveSuggestion(null);
          }}
          className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        <button
          onClick={() => {
            onReject(activeSuggestion);
            setActiveSuggestion(null);
          }}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>,
    document.body
  );
}
