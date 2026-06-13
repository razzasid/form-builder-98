import { router } from '../trpc';
import { authRouter } from './auth';
import { formsRouter } from './forms';
import { fieldsRouter } from './fields';
import { submissionsRouter } from './submissions';

export const appRouter = router({
  auth: authRouter,
  forms: formsRouter,
  fields: fieldsRouter,
  submissions: submissionsRouter,
});

export type AppRouter = typeof appRouter;
