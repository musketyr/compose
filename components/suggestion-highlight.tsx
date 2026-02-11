'use client';

import { useEffect, useState, useRef } from 'react';
import { Check, X } from 'lucide-react';

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

interface HighlightPosition {
  suggestion: Suggestion;
  top: number;
  left: number;
  width: number;
}

export function SuggestionHighlight({ 
  editorElement, 
  suggestions, 
  onAccept, 
  onReject 
}: SuggestionHighlightProps) {
  const [highlights, setHighlights] = useState<HighlightPosition[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find and position highlights
  useEffect(() => {
    if (!editorElement) return;

    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    const newHighlights: HighlightPosition[] = [];

    const treeWalker = document.createTreeWalker(
      editorElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Text | null;
    while ((node = treeWalker.nextNode() as Text | null)) {
      const text = node.textContent || '';
      
      for (const suggestion of pendingSuggestions) {
        const index = text.indexOf(suggestion.original);
        if (index !== -1) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + suggestion.original.length);
          
          const rect = range.getBoundingClientRect();
          const editorRect = editorElement.getBoundingClientRect();
          
          newHighlights.push({
            suggestion,
            top: rect.top - editorRect.top + editorElement.scrollTop,
            left: rect.left - editorRect.left,
            width: rect.width,
          });
        }
      }
    }

    setHighlights(newHighlights);
  }, [editorElement, suggestions]);

  const handleHighlightClick = (highlight: HighlightPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSuggestion(highlight.suggestion);
    setPopoverPos({
      top: highlight.top - 80,
      left: highlight.left,
    });
  };

  const closePopover = () => {
    setActiveSuggestion(null);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editorElement) return null;

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Highlight overlays */}
      {highlights.map((highlight, idx) => (
        <div
          key={highlight.suggestion.id + idx}
          className="absolute bg-yellow-200/50 border-b-2 border-yellow-400 cursor-pointer pointer-events-auto hover:bg-yellow-300/60 transition-colors"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: 24,
          }}
          onClick={(e) => handleHighlightClick(highlight, e)}
          title={`Suggestion: ${highlight.suggestion.suggested}`}
        />
      ))}

      {/* Popover */}
      {activeSuggestion && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 pointer-events-auto min-w-[280px]"
          style={{
            top: Math.max(popoverPos.top, 10),
            left: popoverPos.left,
          }}
        >
          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 w-16">Original:</span>
              <span className="text-sm text-red-600 line-through flex-1">
                {activeSuggestion.original}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 w-16">Replace:</span>
              <span className="text-sm text-green-600 font-medium flex-1">
                {activeSuggestion.suggested}
              </span>
            </div>
            {activeSuggestion.reason && (
              <p className="text-xs text-gray-500 italic mt-1">
                💡 {activeSuggestion.reason}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                onAccept(activeSuggestion);
                closePopover();
              }}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              Accept
            </button>
            <button
              onClick={() => {
                onReject(activeSuggestion);
                closePopover();
              }}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
