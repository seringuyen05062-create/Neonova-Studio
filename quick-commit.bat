@echo off
echo === Quick Git Commit ===
git add .
set /p message="Nhap commit message: "
git commit -m "%message%"
git push
echo ✅ Pushed to GitHub successfully!
