import { Link } from "react-router";
import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule } from "~/hooks/api/course/use-course";

interface ModuleCardProps {
  module: CourseModule;
  index: number;
}

/**
 * Module card for the course overview grid.
 *
 * Shows module number, title, description, and SLT count.
 * Links to the module detail page.
 */
export function ModuleCard({ module, index }: ModuleCardProps) {
  const sltCount = module.slts?.length ?? 0;
  const moduleCode = module.moduleCode ?? "";

  return (
    <Link
      to={MIDNIGHT_PBL.routes.module(moduleCode)}
      prefetch="intent"
      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mn-primary rounded-xl"
    >
      <Card noHover={false} className="h-full">
        <CardBody className="flex flex-col gap-3">
          {/* Module number badge */}
          <div className="flex items-center gap-3">
            <Badge variant="accent">Module {index + 1}</Badge>
            {sltCount > 0 && (
              <span className="text-xs text-mn-text-muted">
                {sltCount} {sltCount === 1 ? "lesson" : "lessons"}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold font-heading text-mn-text line-clamp-2">
            {module.title ?? "Untitled Module"}
          </h3>

          {/* Description */}
          {module.description && (
            <p className="text-sm text-mn-text-muted line-clamp-3">
              {module.description}
            </p>
          )}

          {/* Module code */}
          <p className="mt-auto pt-2 text-xs font-mono text-mn-text-muted/60 truncate">
            {moduleCode}
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}
