/**
 * Server-side markdown rendering.
 *
 * Converts TipTap JSON content to HTML via markdown extraction,
 * then renders with marked + highlight.js for syntax highlighting.
 */

import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import type { JSONContent } from "@/types/course";

// =============================================================================
// Marked instance with highlight.js
// =============================================================================

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  })
);

marked.setOptions({
  gfm: true,
  breaks: false,
});

// Custom renderer to add data-language attribute to code blocks
const renderer = {
  code({ text, lang }: { text: string; lang?: string | undefined }) {
    const language = lang ?? "";
    const highlighted =
      language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
    const dataAttr = language ? ` data-language="${language}"` : "";
    return `<pre><code class="hljs language-${language}"${dataAttr}>${highlighted}</code></pre>\n`;
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
  return marked.parse(md) as string;
}

/**
 * Render a raw markdown string to HTML.
 */
export function renderRawMarkdown(markdown: string): string {
  if (!markdown) return "";
  return marked.parse(markdown) as string;
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
            if (href) {
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
