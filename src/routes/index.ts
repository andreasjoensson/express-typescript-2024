import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { Router } from 'express';

import { healthCheckRegistry, healthCheckRouter } from '@/routes/healthCheck/healthCheckRouter';
import { userRegistry, userRoutes } from '@/routes/user';

const routes = Router();
const registry = new OpenAPIRegistry([healthCheckRegistry, userRegistry]);

routes.use('/health-check', healthCheckRouter);
routes.use(userRoutes);

export { registry, routes };
