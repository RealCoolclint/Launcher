# Launcher v2 — UX Design

**Design System** : Mercury  
**Phase** : Tranquility Suite · Cellule Vidéo · L'Étudiant

---

## 1. Principes de design

- **Cosmos / spatial** — Fond animé (étoiles, constellations, étoile filante) pour une ambiance immersive
- **Modal PlayStation** — Cartes d’apps type carousel avec patches, onglets et ambiances
- **Clarté et hiérarchie** — Typographie contrastée, sections nettes, états visuels explicites
- **Cohérence** — Palette unique, transitions homogènes, feedback immédiat

---

## 2. Identité visuelle

### Design System Mercury

| Élément | Valeur |
|--------|--------|
| Nom | Mercury |
| Contexte | Tranquility Suite, Cellule Vidéo |

### Typographie

| Police | Usage |
|--------|-------|
| **Lato** | Titres, labels, boutons, éléments accentués (300, 400, 700, 900) |
| **Open Sans** | Corps de texte, champs (400, 500, 600) |
| **Space Mono** | Labels de section, versions (monospace) |

- Import : Google Fonts
- Titres : uppercase, `letter-spacing` 1–6px
- Labels : 9–11px, uppercase

### Palette de couleurs

| Variable | Hex | Usage |
|----------|-----|-------|
| `--bg-primary` | `#0a0f1e` | Fond principal, splash |
| `--bg-secondary` | `#0f172a` | Cartes, header |
| `--bg-tertiary` | `#1e293b` | Modales, zones surélevées |
| `--bg-elevated` | `#283548` | Survol, toasts |
| `--text-primary` | `#f0f4ff` | Texte principal |
| `--text-secondary` | `#94a3b8` | Texte secondaire |
| `--text-tertiary` | `#8896aa` | Labels, hints |
| `--accent` | `#2563eb` | Actions primaires, liens |
| `--accent-hover` | `#1d4ed8` | Survol accent |
| `--success` | `#10b981` | Succès, badges locaux |
| `--warning` | `#f59e0b` | Alertes, Master, mises à jour |
| `--danger` | `#ef4444` | Erreurs, suppressions |
| `--border` | `rgba(255,255,255,0.08)` | Bordures |
| `--border-hover` | `rgba(255,255,255,0.18)` | Bordures au survol |

### Espacement et formes

- **Radius** : 6px (petit), 10px (moyen), 16px (grand), 9999px (pill)
- **Ombres** : `shadow`, `shadow-md`, `shadow-lg` — dégradés sombres
- **Transitions** : 0.15s–0.3s, `ease` ou `cubic-bezier(0.16,1,0.3,1)`

---

## 3. Écrans et parcours

### Splash Mercury

- Durée : ~3,8 s
- Grille de points
- Anneau SVG animé (stroke-dashoffset)
- Logo central (patch circulaire)
- Version affichée
- Transition vers le cosmos

### Onboarding

- 4 étapes avec indicateurs de progression (dots)
- Icônes emoji (🚀 👤 🛠️ ✅)
- Champs : prénom, nom, email
- Boutons « Continuer » / « Accéder au dashboard »

### Sélection de profils

- Grille de cartes (180×220px)
- Avatar avec initiales
- Badge Admin / Co-Admin
- Bouton « Modifier » au survol

### Dashboard

- Message personnalisé « Bonjour, {prénom} »
- Sous-titre « Mission Control · Tranquility Suite »
- Grille d’apps : auto-fit, cartes min 210px
- Sections : Favoris, Applications
- Bottom bar : phase Mercury + bouton signalement

### Mode Master

- Sidebar : titre MASTER, onglets (Programme, Équipe, Trousseau, Sync, Système)
- Accent warning (orange) pour la navigation
- Contenu scrollable par onglet

---

## 4. Composants UI

### Cartes d’apps

- Taille : 280px hauteur
- Patch circulaire (90px) avec halo au survol
- Nom, motto, traduction
- Badges : Local/Web, version, état de mise à jour
- Bouton d’action : Lancer / Télécharger / Mettre à jour / Localiser
- Bouton favori (★) en haut à droite
- États : `active`, `vitrine` (non cliquable), `masqué` (caché)

### Modale App (PlayStation)

- Largeur max 980px
- Tabs pour les apps de la suite
- Panneau gauche : canvas d’ambiance (particles, orbit, waves, stars)
- Patch central avec ombre
- Droite : nom, motto, badges, description, infos techniques
- Boutons : Lancer, Changelog, Favori
- Zone « Autres outils » avec suggestions

### Modales standard

- Overlay : fond sombre 88%, blur
- Modal : `bg-tertiary`, bordure, `border-radius-lg`
- Header, body, footer avec séparateurs

### Boutons

| Variante | Style |
|----------|-------|
| Primary | Accent bleu, texte blanc |
| Ghost | Transparent, texte secondaire |
| Danger | Fond danger-light, bordure danger |
| Report | Transparent → danger au survol |
| Master | Accent warning |

### Toasts

- Position : bas-droite, au-dessus de la bottom bar
- Types : success (vert), info (gris), danger (rouge)
- Animation : slide-in depuis la droite
- Durée d’affichage : ~3,5 s

---

## 5. Animations

### Splash

- Grille : fade-in 0.7s
- Anneau : stroke-dashoffset 1.5s
- Logo : scale + rotate, 2.5s
- Version : fade-in 0.5s

### Dashboard

- Greeting : `fadeSlideUp` 0.5s
- Section : `fadeSlideUp` 0.4s, délai 0.18s
- Cartes : `cardSlideIn` 0.4s, délai échelonné (0.28 + index × 0.08 s)

### Cosmos

- Étoiles scintillantes
- Constellations (lignes fines)
- Étoile filante aléatoire (intervalle min 60 s)
- Zoom et dérive légers

### Modales

- Overlay : opacity 0.25s
- Modal : scale 0.95 → 1, 0.2s

---

## 6. Ambiances (modale App)

Chaque app possède une ambiance canvas distincte :

| Type | Effet |
|------|-------|
| `particles` | Particules reliées, zoom doux |
| `orbit` | Orbites avec points lumineux |
| `waves` | Ondes concentriques + sinusoïdales |
| `stars` | Réseau d’étoiles connectées |

Effet parallax au survol du panneau gauche.

---

## 7. Flux d’installation

1. **Étape 1** — Barre de progression, pourcentage, débit (Ko/s), label de phase
2. **Étape 2** — Installation automatique ou fallback manuel (glisser-déposer) avec visuel App → Applications
3. **Étape 3** — Succès « En orbite », bouton « Lancer maintenant »

---

## 8. Accessibilité et ergonomie

- **Title bar** : 28px, `-webkit-app-region: drag` pour déplacer la fenêtre
- **Header / actions** : `no-drag` pour les zones interactives
- **Contraste** : texte clair sur fond sombre
- **Feedback** : toasts, états hover/active, transitions courtes
- **Scrollbars** : fines (4px), thumb discret

---

## 9. Responsive

- Fenêtre min : 900×680px
- Grille apps : `repeat(auto-fit, minmax(210px, 220px))`
- Modales : `max-width: 90vw` pour petits écrans

---

## 10. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `styles.css` | Design System, composants, modales |
| `app.js` | Logique UI, états, rendus |
| `index.html` | Structure, écrans, modales |
