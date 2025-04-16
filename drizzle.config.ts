import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_nqC4bJhv8mZs@ep-muddy-star-abprenmt-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
  },
});
