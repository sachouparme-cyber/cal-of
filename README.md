# cal-of

Jeu 3D de type FPS / arena néon, jouable dans le navigateur avec Three.js.

## Contrôles

- ZQSD : déplacement
- Souris : regarder autour
- Clic gauche : tirer
- Shift : sprint
- Échap : pointer lock / libérer la souris

## Fonctionnalités

- Arène futuriste et secteur de combat néon
- Vagues d’ennemis drones
- Cristaux à récupérer pour augmenter le score
- Système de dégâts, rechargement, vague, timer
- Cinématique de démarrage avec explosions
- Compatible navigateur moderne sans installation

## Sources de ressources publiques

Le projet utilise des assets publics et des bibliothèques open-source depuis des CDN GitHub/JSDelivr pour rester simple à lancer.

- Three.js : https://threejs.org/
- Robot model example : https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive.glb

## Lancer le jeu

Ouvre simplement `index.html` dans un navigateur moderne.

Pour un lancement plus fiable, utilise un petit serveur local comme :

```bash
python -m http.server 8000
```

Puis ouvre : http://localhost:8000
