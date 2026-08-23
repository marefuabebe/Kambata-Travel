"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Sparkles, Highlighter, Palette, Maximize, Minimize,
  Minus, Eye, Edit3, Type, FileText, Eraser
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BioEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuButton = ({ onClick, isActive = false, disabled = false, icon: Icon, title, className = "" }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex items-center justify-center
      ${isActive 
        ? 'bg-[#FF8C00]/20 text-[#FF8C00] dark:bg-[#FF8C00]/30 dark:text-[#FFB050] shadow-inner' 
        : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `}
  >
    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
  </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 self-center shrink-0" />;

export default function BioEditor({ value, onChange }: BioEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Tell your story to the world..." })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    setMounted(true);
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!mounted || !editor) return null;

  const wordCount = editor.storage.characterCount?.words() || editor.getText().trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = editor.getText().length;
  const maxWords = 500;
  const progress = Math.min((wordCount / maxWords) * 100, 100);

  const addImage = () => {
    const url = window.prompt('URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleAiAction = (action: string) => {
    setShowAiMenu(false);
    const toastId = toast.loading(`${action}ing with AI...`);
    setTimeout(() => {
      let newText = "";
      if (action === "Generate") newText = "<p>As a seasoned local guide, my mission is to reveal the hidden gems and rich cultural tapestry of Kambata. Let me lead you through breathtaking landscapes and unforgettable traditions.</p>";
      if (action === "Expand") newText = " I deeply value the connections I make with travelers from around the world, sharing authentic stories that transcend borders.";
      if (action === "Rewrite") newText = "<p><em>Expert guide specializing in immersive cultural and natural experiences in Kambata, dedicated to authentic storytelling.</em></p>";
      
      if (action === "Generate" || action === "Rewrite") {
        editor.chain().focus().setContent(editor.getHTML() + newText).run();
      } else {
        editor.chain().focus().insertContent(newText).run();
      }
      toast.success(`AI ${action} complete!`, { id: toastId });
    }, 1500);
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-black/50 transition-all duration-300
      ${isFullscreen 
        ? 'fixed inset-4 z-[200] rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]' 
        : 'relative flex-1 rounded-2xl focus-within:border-[#FF8C00] focus-within:ring-1 focus-within:ring-[#FF8C00] min-h-[350px]'}
    `}>
      
      {/* TOOLBAR & TABS */}
      <div className="shrink-0 relative z-10 flex flex-wrap items-center p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#1E293B] gap-1 rounded-t-2xl">
        
        {mode === 'write' && (
          <>
          
          <MenuButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" />
          <MenuButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" />
          
          <ToolbarDivider />

          <MenuButton icon={Heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1" />
          <MenuButton icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2" />
          <MenuButton icon={Heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3" />
          <MenuButton icon={Type} onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph" />

          <ToolbarDivider />

          <MenuButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold" />
          <MenuButton icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic" />
          <MenuButton icon={UnderlineIcon} onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline" />
          <MenuButton icon={Strikethrough} onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough" />

          <ToolbarDivider />

          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer" title="Text Color">
             <Palette size={16} className="text-gray-500 absolute z-0 pointer-events-none" />
             <input type="color" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} />
          </div>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer" title="Highlight Color">
             <Highlighter size={16} className="text-gray-500 absolute z-0 pointer-events-none" />
             <input type="color" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()} />
          </div>
          <MenuButton icon={Eraser} onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting" />

          <ToolbarDivider />

          <MenuButton icon={AlignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left" />
          <MenuButton icon={AlignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center" />
          <MenuButton icon={AlignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right" />
          <MenuButton icon={AlignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify" />

          <ToolbarDivider />

          <MenuButton icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List" />
          <MenuButton icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List" />
          <MenuButton icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider" />

          <ToolbarDivider />

          <MenuButton icon={LinkIcon} onClick={setLink} isActive={editor.isActive('link')} title="Insert Link" />
          <MenuButton icon={ImageIcon} onClick={addImage} title="Insert Image" />



          {/* AI Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAiMenu(!showAiMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-black tracking-wide text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 rounded-lg transition-colors shadow-sm border border-purple-200 dark:border-purple-500/30"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
            {showAiMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
                <div className="py-1">
                  <button type="button" onClick={() => handleAiAction('Generate')} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"><Sparkles size={14} className="text-purple-500"/> Generate Bio</button>
                  <button type="button" onClick={() => handleAiAction('Expand')} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"><AlignJustify size={14} className="text-blue-500"/> Expand Text</button>
                  <button type="button" onClick={() => handleAiAction('Rewrite')} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"><Edit3 size={14} className="text-emerald-500"/> Rewrite Better</button>
                </div>
              </div>
            )}
          </div>
          
          <MenuButton icon={isFullscreen ? Minimize : Maximize} onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" />

          </>
        )}

        <div className="flex-1 min-w-[20px]"></div>

        {/* TABS */}
        <div className="flex bg-white dark:bg-black/20 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ml-auto">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mode === 'write' ? 'bg-[#FF8C00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Edit3 size={14} /> <span className="hidden sm:inline">Write</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mode === 'preview' ? 'bg-[#FF8C00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className={`flex-1 relative overflow-y-auto custom-scrollbar ${mode === 'write' ? 'bg-white dark:bg-[#0B1120] dark:shadow-inner' : 'bg-gray-50 dark:bg-black/40'}`}>
        {mode === 'write' ? (
          <div className="p-5 min-h-full">
             <EditorContent 
               editor={editor} 
               className="text-gray-900 dark:text-gray-200 prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px]
                          prose-p:leading-relaxed prose-headings:font-black prose-a:text-[#FF8C00] prose-a:cursor-pointer
                          prose-img:rounded-xl prose-img:shadow-md [&>div]:focus:outline-none dark:caret-white
                          [&_.is-empty::before]:text-gray-400 [&_.is-empty::before]:dark:text-gray-600"
             />
          </div>
        ) : (
          <div className="p-5 min-h-full">
            {value.trim() && value !== '<p></p>' ? (
              <div 
                className="text-gray-900 dark:text-gray-200 prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-a:text-[#FF8C00] prose-img:rounded-xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
              />
            ) : (
              <p className="text-gray-400 dark:text-gray-600 italic text-sm text-center mt-10">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      {/* FOOTER COUNTERS */}
      <div className={`px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E293B] shrink-0 ${isFullscreen ? 'rounded-b-3xl' : 'rounded-b-2xl'}`}>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
             <FileText size={12} /> Rich Text Active
           </span>
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:inline-block border-l border-gray-300 dark:border-gray-700 pl-3">
             {charCount} Characters
           </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-black tracking-wider uppercase ${wordCount > maxWords ? 'text-red-500' : 'text-gray-500'}`}>
            {wordCount} / {maxWords} words
          </span>
          <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center relative bg-gray-200 dark:bg-white/10">
            <svg className="absolute w-4 h-4 transform -rotate-90">
              <circle cx="8" cy="8" r="7" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-gray-200 dark:text-white/10" />
              <circle cx="8" cy="8" r="7" fill="transparent" stroke="currentColor" strokeWidth="2" 
                strokeDasharray="44" 
                strokeDashoffset={44 - (44 * progress) / 100} 
                className={`${wordCount > maxWords ? 'text-red-500' : 'text-[#FF8C00]'} transition-all duration-300`} 
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
