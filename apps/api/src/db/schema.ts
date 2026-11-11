import {
  mysqlTable,
  varchar,
  text,
  json,
  boolean,
  timestamp,
  int,
  index,
} from 'drizzle-orm/mysql-core';
import type {
  ProductTemplate,
  DesignDocument,
  RoomProject,
  Inquiry,
  BusinessSettings,
} from '@3dmantap/shared';
export const user = mysqlTable('user', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: varchar('role', { length: 20 }).notNull().default('customer'),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const session = mysqlTable('session', {
  id: varchar('id', { length: 64 }).primaryKey(),
  expiresAt: timestamp('expires_at', { fsp: 3 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});
export const account = mysqlTable('account', {
  id: varchar('id', { length: 64 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { fsp: 3 }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { fsp: 3 }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const verification = mysqlTable('verification', {
  id: varchar('id', { length: 64 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { fsp: 3 }).notNull(),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const templates = mysqlTable('templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  data: json('data').$type<ProductTemplate>().notNull(),
});
export const designs = mysqlTable(
  'designs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    ownerId: varchar('owner_id', { length: 160 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    document: json('document').$type<DesignDocument>().notNull(),
    shareToken: varchar('share_token', { length: 128 }).notNull(),
    updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
  },
  (t) => [index('design_owner').on(t.ownerId)],
);
export const rooms = mysqlTable('rooms', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 160 }).notNull(),
  document: json('document').$type<RoomProject>().notNull(),
  shareToken: varchar('share_token', { length: 128 }).notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const inquiries = mysqlTable('inquiries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 160 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
  data: json('data').$type<Inquiry>().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const assets = mysqlTable('assets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 160 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  mime: varchar('mime', { length: 100 }).notNull(),
  kind: varchar('kind', { length: 20 }).notNull(),
  width: int('width'),
  height: int('height'),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
});
export const jobs = mysqlTable('jobs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  inquiryId: varchar('inquiry_id', { length: 64 }).notNull(),
  revision: int('revision').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  error: text('error'),
  snapshot: json('snapshot').$type<Inquiry>().notNull(),
  attempts: int('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
export const settings = mysqlTable('settings', {
  id: varchar('id', { length: 32 }).primaryKey(),
  data: json('data').$type<BusinessSettings>().notNull(),
});
export const audit = mysqlTable('audit', {
  id: varchar('id', { length: 64 }).primaryKey(),
  actorId: varchar('actor_id', { length: 160 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetId: varchar('target_id', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
});
