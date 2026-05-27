@echo off
REM 더블클릭으로 main repo의 .env.local에 관리자 hash를 설정합니다.
REM ID=pgdk4983 / PW=@kjh4983 로 하드코드되어 있으니 변경하려면 아래 라인을 편집하세요.

cd /d C:\클코클라우드6.3
echo === main repo .env.local 갱신 시작 ===
npx tsx C:\클코클라우드6.3\.claude\worktrees\ecstatic-antonelli-a029f3\scripts\setup-admin-secrets.ts pgdk4983 @kjh4983
echo.
echo === 자격증명 검증 ===
npx tsx C:\클코클라우드6.3\.claude\worktrees\ecstatic-antonelli-a029f3\scripts\check-admin-env.ts pgdk4983 @kjh4983
echo.
echo ============================================
echo 이제 dev 서버를 Ctrl+C 후 npm run dev 로 재시작하세요.
echo ============================================
pause
