/**
 * Evidence Form — collects assignment evidence from the student.
 *
 * Textarea for notes/description, repeatable URL inputs, and submit button.
 * Pre-fills from existing evidence when updating a submission.
 *
 * Does NOT import Mesh SDK — safe for any rendering context.
 *
 * @see ~/hooks/api/course/use-assignment-commitment.ts — EvidencePayload type
 */

import { useState, useCallback, type FormEvent } from "react";
import { Button } from "~/components/ui/button";
import type { EvidencePayload } from "~/hooks/api/course/use-assignment-commitment";

// =============================================================================
// Types
// =============================================================================

export interface EvidenceFormData {
  notes: string;
  urls: string[];
}

interface EvidenceFormProps {
  /** Pre-fill form with existing evidence (for update flow) */
  initialEvidence?: EvidencePayload | null;
  /** Called when the form is submitted with valid data */
  onSubmit: (data: EvidenceFormData) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Button label (changes based on context) */
  submitLabel?: string;
  /** Whether the form is read-only */
  readOnly?: boolean;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * At least notes or one non-empty URL is required.
 */
function isValid(notes: string, urls: string[]): boolean {
  const hasNotes = notes.trim().length > 0;
  const hasUrls = urls.some((u) => u.trim().length > 0);
  return hasNotes || hasUrls;
}

/**
 * Basic URL format check. Allows http, https, and bare domains.
 */
function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // empty is fine (will be filtered out)
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    new URL(withProtocol);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Component
// =============================================================================

export function EvidenceForm({
  initialEvidence,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Submit Evidence",
  readOnly = false,
}: EvidenceFormProps) {
  const [notes, setNotes] = useState(initialEvidence?.notes ?? "");
  const [urls, setUrls] = useState<string[]>(() => {
    const existing = initialEvidence?.urls;
    if (Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    return [""]; // Start with one empty URL field
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const addUrl = useCallback(() => {
    setUrls((prev) => [...prev, ""]);
  }, []);

  const removeUrl = useCallback((index: number) => {
    setUrls((prev) => {
      if (prev.length <= 1) return [""]; // Keep at least one
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateUrl = useCallback((index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      // Validate
      if (!isValid(notes, urls)) {
        setValidationError(
          "Please provide at least some notes or one URL as evidence."
        );
        return;
      }

      // Check URL formats
      const invalidUrls = urls.filter((u) => u.trim() && !isValidUrl(u));
      if (invalidUrls.length > 0) {
        setValidationError(
          "One or more URLs are not valid. Please check the format."
        );
        return;
      }

      // Filter out empty URLs
      const cleanUrls = urls
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      onSubmit({ notes: notes.trim(), urls: cleanUrls });
    },
    [notes, urls, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Notes / Description */}
      <div className="space-y-2">
        <label
          htmlFor="evidence-notes"
          className="block text-sm font-medium text-mn-text"
        >
          Notes / Description
        </label>
        <textarea
          id="evidence-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what you built, learned, or discovered..."
          rows={5}
          disabled={isSubmitting || readOnly}
          className="w-full rounded-lg border border-midnight-border bg-midnight-surface px-4 py-3 text-sm text-mn-text placeholder:text-mn-text-muted/50 focus:border-mn-primary-light focus:outline-none focus:ring-1 focus:ring-mn-primary-light disabled:opacity-50"
        />
      </div>

      {/* URL inputs */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-mn-text">
          Supporting URLs
        </label>
        <p className="text-xs text-mn-text-muted">
          Link to your code repository, deployed project, documentation, or
          other evidence.
        </p>

        <div className="space-y-2">
          {urls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://github.com/..."
                disabled={isSubmitting || readOnly}
                className="flex-1 rounded-lg border border-midnight-border bg-midnight-surface px-4 py-2.5 text-sm text-mn-text placeholder:text-mn-text-muted/50 focus:border-mn-primary-light focus:outline-none focus:ring-1 focus:ring-mn-primary-light disabled:opacity-50"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  disabled={isSubmitting || urls.length <= 1}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-midnight-border text-mn-text-muted transition-colors hover:border-error/30 hover:text-error disabled:opacity-30"
                  title="Remove URL"
                  aria-label="Remove URL"
                >
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={addUrl}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center gap-1 text-sm text-mn-primary-light transition-colors hover:text-mn-primary disabled:opacity-50"
          >
            <AddIcon />
            Add another URL
          </button>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="rounded-lg border border-error/30 bg-error/10 p-3">
          <p className="text-sm text-error">{validationError}</p>
        </div>
      )}

      {/* Submit button */}
      {!readOnly && (
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          {submitLabel}
        </Button>
      )}
    </form>
  );
}

// =============================================================================
// Icons
// =============================================================================

function AddIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
