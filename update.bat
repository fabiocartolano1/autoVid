@echo off
echo 🔄 Mise à jour du projet...

:: Aller dans le dossier du script (optionnel si déjà dans le repo)
cd /d %~dp0

:: Git pull
echo 📥 Pull depuis le dépôt Git...
git pull

:: Vérifier si package.json existe pour npm install
if exist package.json (
    echo 📦 Installation / mise à jour des dépendances Node.js...
    npm install
) else (
    echo ⚠️ package.json introuvable, npm install ignoré
)

echo ✅ Mise à jour terminée !
pause
