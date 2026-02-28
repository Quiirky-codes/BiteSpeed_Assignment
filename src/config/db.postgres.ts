import { Pool } from "pg";

console.log("DB URL =", process.env.DATABASE_URL);

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});