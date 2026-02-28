import { Pool } from "pg";

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

console.log("Using Postgres DB");