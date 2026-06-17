import { router } from '../trpc';
import { authRouter } from './auth';
import { formsRouter } from './forms';
import { fieldsRouter } from './fields';
import { submissionsRouter } from './submissions';
import { aiRouter } from './ai';

export const appRouter = router({
  auth: authRouter,
  forms: formsRouter,
  fields: fieldsRouter,
  submissions: submissionsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
