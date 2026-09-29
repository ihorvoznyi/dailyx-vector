import { z } from 'zod';

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ALLOWED_EMAIL',
] as const;

const schema = z
  .object({
    APP_ENV: z.enum(['preview', 'production']).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    PGLITE_DIR: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    ALLOWED_EMAIL: z.email().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV !== 'production') return;
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required in production` });
    }
  });

export type Env = z.infer<typeof schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return schema.parse(
    Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === '' ? undefined : v])),
  );
}

export const env = parseEnv(process.env);
