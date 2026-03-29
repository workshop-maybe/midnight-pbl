import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { MIDNIGHT_PBL } from "~/config/midnight";
import type { CourseModule } from "~/hooks/api/course/use-course";

interface ModuleHeaderProps {
  module: CourseModule;
}

/**
 * Module page header with title, description, and breadcrumb.
 */
export function ModuleHeader({ module }: ModuleHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-mn-text-muted">
        <Link
          to={MIDNIGHT_PBL.routes.learn}
          className="transition-colors hover:text-mn-text"
        >
          Modules
        </Link>
        <span>/</span>
        <span className="text-mn-text">
          {module.title ?? "Untitled Module"}
        </span>
      </nav>

      {/* Module code badge */}
      <Badge variant="violet" className="mb-3">
        {module.moduleCode ?? "Module"}
      </Badge>

      {/* Title */}
      <h1 className="mb-3 text-3xl font-bold font-heading text-mn-text sm:text-4xl">
        {module.title ?? "Untitled Module"}
      </h1>

      {/* Description */}
      {module.description && (
        <p className="max-w-2xl text-lg text-mn-text-muted">
          {module.description}
        </p>
      )}
    </div>
  );
}
