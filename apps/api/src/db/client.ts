import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { config } from '../config';
import * as schema from './schema';
export const pool = mysql.createPool({ uri: config.databaseUrl, connectionLimit: 10 });
export const db = drizzle(pool, { schema, mode: 'default' });
