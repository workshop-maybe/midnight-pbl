/**
 * Server-side markdown rendering.
 *
 * Converts TipTap JSON content to HTML via markdown extraction,
 * then renders with marked + highlight.js for syntax highlighting.
 */

import { Marked } from "marked";
import hljs from "highlight.js";
import type { JSONContent } from "@/types/course";

/** Escape HTML special characters to prevent attribute injection. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow safe URL protocols for links. */
function isSafeHref(href: string): boolean {
  const trimmed = href.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/")
  );
}

/**
 * Strip dangerous HTML from rendered output.
 * Removes script tags, event handlers, and javascript: URLs.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\bon\w+\s*=[^\s>]*/gi, "")
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")
    .replace(/src\s*=\s*"javascript:[^"]*"/gi, 'src=""')
    .replace(/src\s*=\s*'javascript:[^']*'/gi, "src=''");
}

// =============================================================================
// Marked instance with highlight.js
// =============================================================================

const marked = new Marked();

marked.setOptions({
  gfm: true,
  breaks: false,
});

// Custom renderer to add data-language attribute to code blocks
const renderer = {
  code({ text, lang }: { text: string; lang?: string | undefined }) {
    const language = lang ?? "";
    const safeLang = escapeHtml(language);
    const highlighted =
      language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
    const dataAttr = safeLang ? ` data-language="${safeLang}"` : "";
    return `<pre><code class="hljs language-${safeLang}"${dataAttr}>${highlighted}</code></pre>\n`;
  },
};

marked.use({ renderer });

// =============================================================================
// Public API
// =============================================================================

/**
 * Render TipTap JSON content to HTML.
 *
 * Extracts markdown from the JSON tree, then renders it with
 * marked + highlight.js for syntax highlighting.
 *
 * @returns HTML string safe for use with set:html
 */
export function renderMarkdown(
  contentJson: JSONContent | null | undefined
): string {
  const md = extractMarkdown(contentJson);
  if (!md) return "";
  return sanitizeHtml(marked.parse(md) as string);
}

/**
 * Render a raw markdown string to HTML.
 */
export function renderRawMarkdown(markdown: string): string {
  if (!markdown) return "";
  return sanitizeHtml(marked.parse(markdown) as string);
}

// =============================================================================
// TipTap JSON -> Markdown extraction
// =============================================================================

/**
 * Extract readable text from TipTap/ProseMirror JSON content.
 *
 * Converts the JSON tree to markdown-like text. This is a best-effort
 * extraction -- complex formatting may be simplified.
 */
function extractMarkdown(json: JSONContent | null | undefined): string {
  if (!json) return "";

  const lines: string[] = [];
  walkNode(json, lines, 0);
  return lines.join("\n");
}

function walkNode(node: JSONContent, lines: string[], depth: number): void {
  switch (node.type) {
    case "doc":
      walkChildren(node, lines, depth);
      break;

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const prefix = "#".repeat(Math.min(level, 6));
      const text = extractInlineText(node);
      lines.push(`${prefix} ${text}\n`);
      break;
    }

    case "paragraph": {
      const text = extractInlineText(node);
      lines.push(`${text}\n`);
      break;
    }

    case "bulletList":
      walkChildren(node, lines, depth);
      lines.push("");
      break;

    case "orderedList":
      walkChildren(node, lines, depth);
      lines.push("");
      break;

    case "listItem": {
      const text = extractInlineText(node);
      const indent = "  ".repeat(depth);
      lines.push(`${indent}- ${text}`);
      // Handle nested lists
      if (node.content) {
        for (const child of node.content) {
          if (child.type === "bulletList" || child.type === "orderedList") {
            walkNode(child, lines, depth + 1);
          }
        }
      }
      break;
    }

    case "codeBlock": {
      const language = (node.attrs?.language as string) ?? "";
      const text = extractInlineText(node);
      lines.push(`\`\`\`${language}`);
      lines.push(text);
      lines.push("```\n");
      break;
    }

    case "blockquote": {
      const text = extractInlineText(node);
      const quoted = text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      lines.push(`${quoted}\n`);
      break;
    }

    case "horizontalRule":
      lines.push("---\n");
      break;

    case "image": {
      const src = node.attrs?.src as string | undefined;
      const alt = (node.attrs?.alt as string) ?? "";
      if (src) {
        lines.push(`![${alt}](${src})\n`);
      }
      break;
    }

    default:
      // For unknown node types, try to extract any text
      walkChildren(node, lines, depth);
      break;
  }
}

function walkChildren(
  node: JSONContent,
  lines: string[],
  depth: number
): void {
  if (node.content) {
    for (const child of node.content) {
      walkNode(child, lines, depth);
    }
  }
}

/**
 * Extract inline text from a node and its children.
 * Applies basic mark formatting (bold, italic, code, link).
 */
function extractInlineText(node: JSONContent): string {
  if (node.type === "text") {
    let text = node.text ?? "";

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
          case "strong":
            text = `**${text}**`;
            break;
          case "italic":
          case "em":
            text = `*${text}*`;
            break;
          case "code":
            text = `\`${text}\``;
            break;
          case "link": {
            const href = mark.attrs?.href as string | undefined;
            if (href && isSafeHref(href)) {
              text = `[${text}](${href})`;
            }
            break;
          }
        }
      }
    }

    return text;
  }

  if (node.content) {
    return node.content.map((child) => extractInlineText(child)).join("");
  }

  return node.text ?? "";
}
