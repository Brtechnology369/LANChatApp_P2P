cd /path/to/RealTimeChatApp_P2P   # Repo folder में जाओ

# अगर कोई पुरानी गलत JSON है, delete करो
rm message.json

# Dependencies install करो और lockfile generate करो
npm install                       # ये package-lock.json बनाएगा

# Add सभी files
git add .

# Commit message
git commit -m "Add server.js, package.json, package-lock.json, public files for Koyeb deploy"

# Push to GitHub
git push