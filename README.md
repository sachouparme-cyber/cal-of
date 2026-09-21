# CAL-OF

Un mini-jeu 3D jouable directement dans le navigateur : une arène néon, des drones ennemis, des cristaux à récupérer et un modèle 3D chargé depuis les exemples publics de Three.js.

## Jouer

Ouvre `index.html` dans un navigateur moderne, puis clique sur **JOUER**.

- **WASD** : se déplacer
- **Souris** : regarder autour de soi
- **Clic gauche** : tirer
- **Shift** : courir
- **Échap** : libérer la souris

Le jeu utilise Three.js via CDN et peut fonctionner sans installation. Le modèle 3D distant est uniquement un bonus : une capsule de secours est générée si le chargement échoue.

## Sources des assets

- Moteur 3D : [Three.js](https://github.com/mrdoob/three.js)
- Modèle de personnage de démonstration : [RobotExpressive.glb](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive), utilisé depuis les exemples publics de Three.js.

La carte de l'arène est générée dans `game.js` pour rester légère et jouable sans téléchargement supplémentaire.
