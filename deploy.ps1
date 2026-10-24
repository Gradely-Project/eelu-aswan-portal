# EELU Aswan Branch Portal - Automated Deployment Helper
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   EELU Aswan Branch Portal - Automated Deployment Helper" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Switch to Supabase PostgreSQL schema
Write-Host "`n[1/3] Switching schema to Supabase PostgreSQL..." -ForegroundColor Green
node scripts/switch-to-supabase.js
npx prisma generate

# 2. Push schema to Supabase database
Write-Host "`n[2/3] Pushing database tables to Supabase..." -ForegroundColor Green
npx prisma db push --accept-data-loss

# 3. Seed initial admin and tracks
Write-Host "`n[3/3] Seeding tracks and administrative accounts..." -ForegroundColor Green
npm run seed

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "✅ Supabase database is ready and seeded!" -ForegroundColor Green
Write-Host "👉 Now to publish live on Vercel with 0 manual steps, run:" -ForegroundColor Yellow
Write-Host "   npx vercel --prod" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
