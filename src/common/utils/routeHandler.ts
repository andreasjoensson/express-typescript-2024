import { Router } from 'express';

// Defines a template literal type for API versions (e.g., 'v1', 'v2')
type VersionPrefix = `v${number}`;

// Constructs a path for versioned APIs, ensuring type safety and consistency
type VersionedApiPath<Version extends VersionPrefix, RouteSegment extends string> = `/api/${Version}/${RouteSegment}/`;

// Registers routes with the express router, enforcing version and route naming conventions
export const registerVersionedRoute = <Version extends VersionPrefix, RouteSegment extends string>(
  router: Router,
  path: VersionedApiPath<Version, RouteSegment>,
  routeImplementation: Router
): void => {
  router.use(path, routeImplementation);
};
