/**
 * EvidenceViewer — Read-only TipTap viewer for submitted evidence.
 *
 * Uses the same extensions as EvidenceEditor to ensure rendering parity.
 * Falls back to plain text for legacy evidence format ({notes, urls}).
 *
 * MUST be used inside a client:only="react" island.
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import type { JSONContent } from "@tiptap/core";

const lowlight = createLowlight(common);

interface EvidenceViewerProps {
  content: JSONContent | Record<string, unknown> | null;
}

/**
 * Check if content looks like TipTap JSONContent (has `type` field).
 * Legacy evidence format is {notes: string, urls: string[]}.
 */
function isTipTapContent(content: unknown): content is JSONContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    typeof (content as Record<string, unknown>).type === "string"
  );
}

export function EvidenceViewer({ content }: EvidenceViewerProps) {
  // Handle legacy format
  if (content && !isTipTapContent(content)) {
    const legacy = content as { notes?: string; urls?: string[] };
    return (
      <div className="rounded-sm border border-midnight-border bg-midnight-card p-4 text-sm text-mn-text-muted">
        {legacy.notes && <p className="mb-2 whitespace-pre-wrap">{legacy.notes}</p>}
        {legacy.urls && legacy.urls.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {legacy.urls.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mn-primary underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-sm border border-midnight-border bg-midnight-card p-4 text-sm text-mn-text-muted italic">
        No evidence submitted.
      </div>
    );
  }

  return <TipTapViewer content={content} />;
}

function TipTapViewer({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({
        openOnClick: true,
        autolink: false,
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: "evidence-editor-content",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-sm border border-midnight-border bg-midnight-card p-4">
      <EditorContent editor={editor} />
    </div>
  );
}
