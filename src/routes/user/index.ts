import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { Router } from 'express';

import { registerVersionedRoute } from '@/common/utils/routeHandler';
import { userRegistryV1, userRouterV1 } from '@/routes/user/v1/userRouter';

const userRoutes = Router();
const userRegistry = new OpenAPIRegistry([userRegistryV1]);

registerVersionedRoute(userRoutes, '/api/v1/users/', userRouterV1);

export { userRegistry, userRoutes };
