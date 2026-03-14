# OsmoTrack

Application web PWA de suivi d'un système de traitement d'eau domestique (puits privé).

## Système suivi

```
Puits privé → Filtres sédiments/charbon → Adoucisseur (Laugil)
           → Lampe UV (Philips 30W G30 T8) → Osmoseur Water Light 3 étapes
```

**Eau source (analyse 02/04/2024)**
| Paramètre | Valeur |
|---|---|
| Dureté (TH) | 37,3 °f |
| Nitrates | 30 mg/L |
| Conductivité | 717 µS/cm |
| COT | 0,98 mg/L |

---

## Stack technique

| Technologie | Rôle |
|---|---|
| React 18 + Vite | Framework UI + bundler |
| Tailwind CSS | Styles utilitaires |
| Dexie.js (IndexedDB) | Stockage local persistant |
| Chart.js + react-chartjs-2 | Graphiques |
| React Router v6 | Navigation |
| lucide-react | Icônes |
| PWA (manifest + SW) | Installation mobile / hors-ligne |

---

## Modules

1. **Tableau de bord** — KPIs TDS, taux de rejet, alertes urgentes, graphique évolution
2. **Nouveau relevé** — Saisie TDS entrée/sortie, calcul automatique du taux de rejet
3. **Planning maintenance** — Tous équipements, statuts URGENT/BIENTÔT/OK, marquer comme fait
4. **Historique interventions** — Log complet avec coût, fournisseur, catégorie
5. **Stocks consommables** — Stock actuel vs seuil minimum, alertes COMMANDER/FAIBLE/OK
6. **Suivi des coûts** — Total réel vs budget 479 €/an, graphiques par catégorie et par année
7. **Paramètres** — Seuils d'alerte, données eau source, réinitialisation

---

## Installation locale

```bash
# Prérequis : Node.js 18+

# Cloner le dépôt
git clone https://github.com/<USERNAME>/osmotrack.git
cd osmotrack

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
# → http://localhost:5173/

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

---

## Déploiement GitHub Pages

### 1. Créer le dépôt GitHub

```bash
git init
git add .
git commit -m "feat: initial OsmoTrack application"
git remote add origin https://github.com/<USERNAME>/osmotrack.git
git push -u origin main
```

### 2. Activer GitHub Pages

Dans les **Settings** du dépôt → **Pages** :
- Source : **GitHub Actions**

### 3. Déclenchement automatique

Chaque `git push` sur `main` déclenche le workflow `.github/workflows/deploy.yml` qui :
1. Installe les dépendances (`npm ci`)
2. Compile avec Vite (`npm run build`)
3. Déploie sur GitHub Pages

### 4. URL finale

```
https://<USERNAME>.github.io/osmotrack/
```

---

## Icônes PWA (optionnel)

Pour des icônes de qualité sur l'écran d'accueil iOS/Android, générer des PNG depuis le SVG :

```bash
# Avec Inkscape (optionnel)
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-512.png
cp public/icons/icon-192.png public/icons/apple-touch-icon.png
```

Ou utiliser [realfavicongenerator.net](https://realfavicongenerator.net) avec le SVG.

---

## Structure du projet

```
osmotrack/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD GitHub Pages
├── public/
│   ├── manifest.json           # Manifest PWA
│   ├── sw.js                   # Service Worker (cache offline)
│   └── icons/
│       └── icon.svg            # Icône application
├── src/
│   ├── components/
│   │   ├── KPICard.jsx         # Carte indicateur
│   │   ├── Layout.jsx          # Shell (sidebar + bottom nav)
│   │   ├── Navigation.jsx      # Sidebar desktop + bottom nav mobile
│   │   └── StatusBadge.jsx     # Badge de statut
│   ├── db/
│   │   ├── database.js         # Instance Dexie (IndexedDB)
│   │   └── seedData.js         # Données historiques réelles
│   ├── pages/
│   │   ├── Dashboard.jsx       # Tableau de bord
│   │   ├── NewReading.jsx      # Nouveau relevé TDS
│   │   ├── Maintenance.jsx     # Planning maintenance
│   │   ├── History.jsx         # Historique interventions
│   │   ├── Stocks.jsx          # Stocks consommables
│   │   ├── Costs.jsx           # Suivi des coûts
│   │   └── Settings.jsx        # Paramètres
│   ├── utils/
│   │   └── maintenance.js      # Calcul statuts, formatage dates
│   ├── App.jsx                 # Router principal
│   ├── index.css               # Styles Tailwind + composants
│   └── main.jsx                # Point d'entrée + SW registration
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── postcss.config.js
```

---

## Données pré-chargées

### Relevés TDS
| Date | Entrée | Sortie | Rejet | Statut |
|------|--------|--------|-------|--------|
| 31/10/2025 | 285 ppm | 123 ppm | 56,8% | Critique |
| 05/11/2025 | 284 ppm | 13 ppm | 95,4% | Optimal |
| 21/11/2025 | 295 ppm | 56 ppm | 81,0% | Acceptable |
| 22/12/2025 | 271 ppm | 71 ppm | 73,8% | Dégradé |

### Seuils d'alerte configurés
| Paramètre | Seuil | Action |
|---|---|---|
| TDS sortie | > 50 ppm | Alerte orange |
| Taux de rejet | < 75% | Alerte rouge |
| Nitrates sortie | > 10 mg/L | Alerte critique |
| Vie filtre | < 30% | Rappel orange |
| Vie filtre | < 10% | Alerte rouge |

---

## Licence

Usage privé — Tous droits réservés.
