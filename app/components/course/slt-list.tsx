import { Link } from "react-router";
import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { SLT } from "~/hooks/api/course/use-course";

interface SLTListProps {
  slts: SLT[];
  moduleCode: string;
}

/**
 * Display a list of Student Learning Targets for a module.
 *
 * Each SLT links to its corresponding lesson page.
 */
export function SLTList({ slts, moduleCode }: SLTListProps) {
  if (slts.length === 0) {
    return (
      <div className="rounded-xl border border-midnight-border bg-midnight-surface/50 p-8 text-center">
        <p className="text-mn-text-muted">
          No learning targets available for this module yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="mb-4 text-xl font-semibold font-heading text-mn-text">
        Learning Targets
      </h2>
      {slts.map((slt, index) => {
        const lessonIndex = slt.moduleIndex ?? index;

        return (
          <Link
            key={slt.sltId ?? index}
            to={MIDNIGHT_PBL.routes.lesson(moduleCode, lessonIndex)}
            prefetch="intent"
            className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mn-primary-light rounded-xl"
          >
            <Card noHover={false}>
              <CardBody className="flex items-start gap-4">
                {/* Index badge */}
                <Badge variant="info" className="mt-0.5 shrink-0">
                  {lessonIndex}
                </Badge>

                {/* SLT text */}
                <div className="flex-1">
                  <p className="text-sm text-mn-text">
                    {slt.sltText ?? "Untitled learning target"}
                  </p>
                  {slt.hasLesson && (
                    <span className="mt-1 inline-block text-xs text-mn-primary-light">
                      View lesson
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
