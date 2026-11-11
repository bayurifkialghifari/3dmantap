import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/client';
import { user, session, account, verification } from './db/schema';
import { config } from './config';
export const auth = betterAuth({
  baseURL: config.appUrl,
  basePath: '/api/v1/auth',
  secret: config.secret,
  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 12 },
  user: { additionalFields: { role: { type: 'string', defaultValue: 'customer', input: false } } },
  trustedOrigins: [config.appUrl],
  advanced: { useSecureCookies: config.production },
});
