import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { JSONContent } from "~/hooks/api/course/use-course";

interface LessonContentProps {
  /** TipTap JSON content from the API */
  contentJson?: JSONContent | null;
  /** Fallback: raw markdown string */
  markdown?: string;
}

/**
 * Renders lesson content.
 *
 * The Andamio API stores content as TipTap JSON. This component extracts
 * text from the JSON tree and renders it via react-markdown with GFM
 * support and syntax highlighting.
 *
 * Fallback: if a raw markdown string is provided, it renders that directly.
 */
export function LessonContent({ contentJson, markdown }: LessonContentProps) {
  const content = markdown ?? extractMarkdown(contentJson);

  if (!content) {
    return (
      <div className="rounded-sm border border-midnight-border bg-midnight-surface/50 p-8 text-center">
        <p className="text-mn-text-muted">
          No content available for this lesson yet.
        </p>
      </div>
    );
  }

  return (
    <article className="prose-midnight">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

/**
 * Custom component overrides for react-markdown.
 *
 * The `code` override extracts the language from rehype-highlight's
 * `language-xxx` class and sets a `data-language` attribute so CSS
 * can render a language label badge via `::before { content: attr(...) }`.
 */
const markdownComponents: Components = {
  code({ className, children, ...rest }) {
    const match = className?.match(/language-(\w+)/);
    const language = match?.[1];
    return (
      <code className={className} data-language={language} {...rest}>
        {children}
      </code>
    );
  },
};

// =============================================================================
// TipTap JSON -> Markdown extraction
// =============================================================================

/**
 * Extract readable text from TipTap/ProseMirror JSON content.
 *
 * Converts the JSON tree to markdown-like text. This is a best-effort
 * extraction — complex formatting may be simplified.
 */
function extractMarkdown(json: JSONContent | null | undefined): string {
  if (!json) return "";

  const lines: string[] = [];
  walkNode(json, lines, 0);
  return lines.join("\n");
}

function walkNode(
  node: JSONContent,
  lines: string[],
  depth: number
): void {
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
          if (
            child.type === "bulletList" ||
            child.type === "orderedList"
          ) {
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
