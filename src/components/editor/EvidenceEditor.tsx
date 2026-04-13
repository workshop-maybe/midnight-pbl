/**
 * EvidenceEditor — TipTap rich text editor for assignment evidence.
 *
 * Simplified editor with a compact toolbar for essential formatting:
 * bold, italic, headings, lists, code blocks, links, undo/redo.
 *
 * MUST be used inside a client:only="react" island.
 */

import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import type { JSONContent } from "@tiptap/core";

const lowlight = createLowlight(common);

// =============================================================================
// Types
// =============================================================================

interface EvidenceEditorProps {
  content?: JSONContent | null;
  onContentChange?: (content: JSONContent) => void;
  placeholder?: string;
  disabled?: boolean;
}

// =============================================================================
// Editor Component
// =============================================================================

export function EvidenceEditor({
  content,
  onContentChange,
  placeholder = "Describe your work, what you built, and what you learned...",
  disabled = false,
}: EvidenceEditorProps) {
  const lastJsonRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: content ?? undefined,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (!onContentChange) return;
      const json = editor.getJSON();
      const jsonStr = JSON.stringify(json);
      // Prevent duplicate fires when content hasn't changed
      if (jsonStr !== lastJsonRef.current) {
        lastJsonRef.current = jsonStr;
        onContentChange(json);
      }
    },
    editorProps: {
      attributes: {
        class: "evidence-editor-content",
        "data-placeholder": placeholder,
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-sm border border-midnight-border overflow-hidden">
        <div className="flex items-center gap-0.5 border-b border-midnight-border bg-midnight-surface/50 px-2 py-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 w-7 animate-pulse rounded-sm bg-midnight-surface" />
          ))}
        </div>
        <div className="bg-[#ece6d6] p-5">
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-midnight-border overflow-hidden">
      {!disabled && <Toolbar editor={editor} />}
      <div className="bg-[#ece6d6] p-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// =============================================================================
// Toolbar
// =============================================================================

// =============================================================================
// Toolbar Icons (16x16 SVG, stroke-based, consistent 1.5 stroke width)
// =============================================================================

const I = ({ d, ...props }: { d: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d={d} />
  </svg>
);

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-px border-b border-midnight-border bg-midnight-surface/60 px-1.5 py-1">
      {/* Text formatting */}
      <div className="flex items-center">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <I d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <I d="M19 4h-9M14 20H5M15 4L9 20" />
        </Btn>
      </div>

      <Sep />

      {/* Structure */}
      <div className="flex items-center">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <span className="text-[11px] font-semibold leading-none">H2</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <span className="text-[11px] font-semibold leading-none">H3</span>
        </Btn>
      </div>

      <Sep />

      {/* Lists */}
      <div className="flex items-center">
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fill="currentColor" stroke="none" fontSize="7" fontFamily="system-ui">1</text><text x="2" y="14" fill="currentColor" stroke="none" fontSize="7" fontFamily="system-ui">2</text><text x="2" y="20" fill="currentColor" stroke="none" fontSize="7" fontFamily="system-ui">3</text></svg>
        </Btn>
      </div>

      <Sep />

      {/* Blocks */}
      <div className="flex items-center">
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <I d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.542-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.542-2.917-1.179z"/></svg>
        </Btn>
        <Btn onClick={setLink} active={editor.isActive("link")} title="Link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </Btn>
      </div>

      <Sep />

      {/* History */}
      <div className="flex items-center">
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </Btn>
      </div>
    </div>
  );
}

// =============================================================================
// Toolbar Primitives
// =============================================================================

function Btn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center h-8 w-8 rounded-sm transition-colors
        ${active
          ? "bg-mn-primary/15 text-mn-primary"
          : "text-mn-text-muted hover:text-mn-text hover:bg-midnight-surface"
        }
        ${disabled ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-5 w-px bg-midnight-border/60" />;
}
