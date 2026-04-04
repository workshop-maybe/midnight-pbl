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
      <div className="rounded-sm border border-midnight-border bg-midnight-card p-4">
        <div className="h-48 animate-pulse rounded bg-midnight-surface" />
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-midnight-border bg-midnight-card overflow-hidden">
      {!disabled && <Toolbar editor={editor} />}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// =============================================================================
// Toolbar
// =============================================================================

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-midnight-border bg-midnight-surface/50 px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        1.
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code Block"
      >
        {"</>"}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        "
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
        🔗
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        ↪
      </ToolbarButton>
    </div>
  );
}

// =============================================================================
// Toolbar Primitives
// =============================================================================

function ToolbarButton({
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
        flex items-center justify-center h-7 min-w-[1.75rem] px-1.5
        text-xs font-mono rounded-sm transition-colors
        ${active
          ? "bg-mn-primary/20 text-mn-primary"
          : "text-mn-text-muted hover:text-mn-text hover:bg-midnight-surface"
        }
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-midnight-border" />;
}
