const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

schema = schema.replace(
  /datasource db\s*\{[\s\S]*?\}/,
  `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
);

fs.writeFileSync(schemaPath, schema, "utf-8");
console.log("✅ Successfully switched prisma/schema.prisma to SQLite (Local Dev)!");
console.log("👉 Make sure DATABASE_URL=\"file:./dev.db\" in .env");
