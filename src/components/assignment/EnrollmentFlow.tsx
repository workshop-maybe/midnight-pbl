/**
 * Enrollment Flow
 *
 * Orchestrates the full assignment enrollment/submission flow:
 *   1. Student fills evidence form (notes + URLs)
 *   2. Evidence is saved to DB via gateway
 *   3. On-chain commitment TX is executed
 *   4. On success, commitment query is invalidated to refresh status
 *
 * Also handles evidence updates for IN_PROGRESS and ASSIGNMENT_DENIED states.
 *
 * MUST be rendered in a client:only="react" island — uses useTransaction
 * (which imports useWallet from @meshsdk/react).
 */

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useTransaction } from "@/hooks/tx/use-transaction";
import {
  useInvalidateCommitment,
  type EvidencePayload,
} from "@/hooks/api/course/use-assignment-commitment";
import { gatewayAuthPost } from "@/lib/gateway";
import {
  EvidenceForm,
  type EvidenceFormData,
} from "@/components/assignment/EvidenceForm";
import { TransactionButton } from "@/components/tx/transaction-button";
import { TxStatus } from "@/components/tx/tx-status";
import { commitmentKeys } from "@/hooks/api/query-keys";

// =============================================================================
// Types
// =============================================================================

interface EnrollmentFlowProps {
  /** Course NFT policy ID */
  courseId: string;
  /** Module code (e.g., "MN001") */
  moduleCode: string;
  /** Module SLT hash (64-char hex) */
  sltHash: string;
  /** User alias from auth store */
  alias: string;
  /** Whether this is an update to an existing submission */
  isUpdate?: boolean;
  /** Pre-existing evidence to pre-fill the form */
  existingEvidence?: EvidencePayload | null;
}

/** Response from the evidence save endpoint */
interface SaveEvidenceResponse {
  success?: boolean;
  [key: string]: unknown;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Compute a simple hash of the evidence object for on-chain storage.
 * Uses a hex-encoded SHA-256 digest of the JSON-serialized evidence.
 */
async function hashEvidence(evidence: EvidenceFormData): Promise<string> {
  const payload = JSON.stringify(evidence);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// =============================================================================
// Component
// =============================================================================

export function EnrollmentFlow({
  courseId,
  moduleCode,
  sltHash,
  alias,
  isUpdate = false,
  existingEvidence,
}: EnrollmentFlowProps) {
  const jwt = useAuthStore((s) => s.jwt);
  const invalidateCommitment = useInvalidateCommitment();

  const {
    execute,
    state: txState,
    result,
    error: txError,
    reset,
  } = useTransaction();

  const [isSavingEvidence, setIsSavingEvidence] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Once evidence is submitted, show the TX flow instead of the form */
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  /**
   * Full submission flow:
   * 1. Save evidence to DB
   * 2. Execute on-chain commitment TX
   */
  const handleSubmit = useCallback(
    async (data: EvidenceFormData) => {
      if (!jwt) return;

      setSaveError(null);
      setIsSavingEvidence(true);

      try {
        // Step 1: Save evidence to DB
        const evidenceHash = await hashEvidence(data);

        const saveEndpoint = isUpdate
          ? "/api/v2/course/student/assignment-commitment/update-evidence"
          : "/api/v2/course/student/assignment-commitment/create";

        const saveBody: Record<string, unknown> = {
          course_id: courseId,
          evidence: { notes: data.notes, urls: data.urls },
          evidence_hash: evidenceHash,
        };

        if (isUpdate) {
          saveBody.course_module_code = moduleCode;
        } else {
          saveBody.slt_hash = sltHash;
          saveBody.course_module_code = moduleCode;
        }

        await gatewayAuthPost<SaveEvidenceResponse>(
          saveEndpoint,
          jwt,
          saveBody
        );

        setIsSavingEvidence(false);
        setEvidenceSubmitted(true);

        // Step 2: Execute on-chain TX
        const txType = isUpdate
          ? ("COURSE_STUDENT_ASSIGNMENT_UPDATE" as const)
          : ("COURSE_STUDENT_ASSIGNMENT_COMMIT" as const);

        await execute(
          txType,
          {
            alias,
            course_id: courseId,
            slt_hash: sltHash,
            assignment_info: evidenceHash,
          },
          {
            invalidateKeys: [
              [...commitmentKeys.detail(courseId, moduleCode)],
              [...commitmentKeys.all],
            ],
            onSuccess: async () => {
              await invalidateCommitment(courseId, moduleCode);
            },
          }
        );
      } catch (err) {
        setIsSavingEvidence(false);
        const message =
          err instanceof Error ? err.message : "Failed to save evidence";
        setSaveError(message);
      }
    },
    [
      jwt,
      courseId,
      moduleCode,
      sltHash,
      alias,
      isUpdate,
      execute,
      invalidateCommitment,
    ]
  );

  const handleReset = useCallback(() => {
    reset();
    setEvidenceSubmitted(false);
    setSaveError(null);
  }, [reset]);

  // After successful TX
  if (txState === "success" && result?.txHash) {
    return (
      <div className="space-y-4">
        <TxStatus txState={txState} txHash={result.txHash} />
        <div className="rounded-sm border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-sm font-medium text-success">
            {isUpdate
              ? "Assignment updated successfully!"
              : "Assignment submitted successfully!"}
          </p>
          <p className="mt-1 text-xs text-mn-text-muted">
            Your submission is now on-chain and awaiting review.
          </p>
        </div>
      </div>
    );
  }

  // TX in progress (evidence already saved, now doing on-chain TX)
  if (evidenceSubmitted && txState !== "idle" && txState !== "error") {
    return (
      <div className="space-y-4">
        <TxStatus txState={txState} error={txError} />
        <TransactionButton
          state={txState}
          label={isUpdate ? "Update Assignment" : "Submit Assignment"}
          onClick={() => {
            /* TX is already in progress */
          }}
          onRetry={handleReset}
        />
      </div>
    );
  }

  // TX error — allow retry
  if (txState === "error") {
    return (
      <div className="space-y-4">
        <TxStatus txState={txState} error={txError} />
        <TransactionButton
          state={txState}
          label={isUpdate ? "Update Assignment" : "Submit Assignment"}
          onClick={handleReset}
          onRetry={handleReset}
        />
      </div>
    );
  }

  // Default: show the evidence form
  return (
    <div className="space-y-4">
      {/* Save error */}
      {saveError && (
        <div className="rounded-sm border border-error/30 bg-error/10 p-3">
          <p className="text-sm text-error">{saveError}</p>
        </div>
      )}

      <EvidenceForm
        initialEvidence={existingEvidence}
        onSubmit={(data) => void handleSubmit(data)}
        isSubmitting={isSavingEvidence}
        submitLabel={isUpdate ? "Update & Resubmit" : "Enroll & Submit"}
      />
    </div>
  );
}
