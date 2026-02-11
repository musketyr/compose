'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { 
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon,
  Link as LinkIcon, Youtube as YoutubeIcon
} from 'lucide-react';
import { cn } from '@/lib/cn';

const lowlight = createLowlight(common);

interface EditorProps {
  content?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
}

export function Editor({ content, onChange, editable = true }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
    ],
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    },
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] max-w-none',
      },
    },
  });

  const addImage = () => {
    const url = window.prompt('Image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addYoutube = () => {
    const url = window.prompt('YouTube URL:');
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {editable && (
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('bold') && 'bg-gray-300'
            )}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('italic') && 'bg-gray-300'
            )}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('strike') && 'bg-gray-300'
            )}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('code') && 'bg-gray-300'
            )}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('heading', { level: 1 }) && 'bg-gray-300'
            )}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('heading', { level: 2 }) && 'bg-gray-300'
            )}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('bulletList') && 'bg-gray-300'
            )}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('orderedList') && 'bg-gray-300'
            )}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 transition-colors',
              editor.isActive('blockquote') && 'bg-gray-300'
            )}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Add Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={addLink}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={addYoutube}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Add YouTube Video"
          >
            <YoutubeIcon className="w-4 h-4" />
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
