import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';
import { GetUserSchema, UserSchema } from '@/routes/user/v1/userModel';
import { userService } from '@/routes/user/v1/userService';

export const userRegistryV1 = new OpenAPIRegistry();

userRegistryV1.register('User', UserSchema);

export const userRouterV1: Router = (() => {
  const router = express.Router();

  userRegistryV1.registerPath({
    method: 'get',
    path: '/api/v1/users',
    tags: ['User'],
    responses: createApiResponse(z.array(UserSchema), 'Success'),
  });

  router.get('/', async (_req: Request, res: Response) => {
    const serviceResponse = await userService.findAll();
    handleServiceResponse(serviceResponse, res);
  });

  userRegistryV1.registerPath({
    method: 'get',
    path: '/api/v1/users/{id}',
    tags: ['User'],
    request: { params: GetUserSchema.shape.params },
    responses: createApiResponse(UserSchema, 'Success'),
  });

  router.get('/:id', validateRequest(GetUserSchema), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const serviceResponse = await userService.findById(id);
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
