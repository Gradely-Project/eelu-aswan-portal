const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

schema = schema.replace(
  /datasource db\s*\{[\s\S]*?\}/,
  `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
);

fs.writeFileSync(schemaPath, schema, "utf-8");
console.log("✅ Successfully switched prisma/schema.prisma to PostgreSQL (Supabase)!");
console.log("👉 Next steps:");
console.log("1. Put your Supabase DATABASE_URL and DIRECT_URL in .env");
console.log("2. Run: npx prisma db push");
console.log("3. Run: npm run seed");
