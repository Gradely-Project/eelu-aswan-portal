const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('materials', 'materials', true, 52428800, null)
    ON CONFLICT (id) DO UPDATE SET public = true;
  `);
  console.log("Bucket created successfully!");

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Materials'
      ) THEN
        CREATE POLICY "Public Access Materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Upload Materials'
      ) THEN
        CREATE POLICY "Public Upload Materials" ON storage.objects FOR ALL WITH CHECK (bucket_id = 'materials');
      END IF;
    END
    $$;
  `);
  console.log("Policies applied successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
