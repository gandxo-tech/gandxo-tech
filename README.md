# Node / Socket.io prototype - Gdxgame

Prototype multijoueur top-down en HTML5 + Node.js + socket.io.

Démarrage local :

1. Installer les dépendances
   npm install

2. Lancer le serveur
   npm start

3. Ouvrir http://localhost:3000 dans plusieurs onglets pour tester.

Architecture :
- server.js : serveur Express + Socket.io, boucle de jeu simple (bullets + collisions)
- public/ : client statique (index.html, client.js, style.css)

Déploiement :
- Railway / Fly / Heroku : pousser le repo, définir le build (Node) et démarrer `npm start`.
- Le serveur écoute sur process.env.PORT.

Améliorations possibles :
- Autorité côté serveur plus robuste (latence comp, client-side prediction)
- Interpolation côté client
- Power-ups / pickups / animations
- Auth / persistent leaderboard

Licence: MIT
