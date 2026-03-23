# Launcher v2 — Vue d'ensemble et système

**Version** : 2.0.0 · **Phase** : Mercury  
**Contexte** : Tranquility Suite · Cellule Vidéo · L'Étudiant

---

## 1. Présentation

Launcher v2 est un **hub central** et point d'entrée unique pour les outils de la Cellule Vidéo. Il permet de :

- Gérer plusieurs profils utilisateur (équipe, rôles, permissions)
- Lancer et configurer les applications de la Tranquility Suite
- Télécharger et installer les apps desktop (BackUpFlow, Transporter)
- Synchroniser les profils via GitHub
- Administrer la suite via un Mode Master (Admin / Co-Admin)

---

## 2. Architecture technique

### Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Electron 28 |
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Stockage | JSON (config locale) |
| IPC | `contextBridge` + `ipcRenderer` (isolation) |

### Structure des dossiers

```
Launcher-v2/
├── src/
│   ├── main/           # Process principal Electron
│   │   ├── main.js     # Point d'entrée, fenêtre, IPC
│   │   ├── preload.js  # API exposée au renderer
│   │   ├── config-manager.js
│   │   ├── github-sync.js
│   │   └── updater.js
│   └── renderer/       # Interface utilisateur
│       ├── index.html
│       ├── app.js      # Logique applicative
│       ├── styles.css  # Design System Mercury
│       ├── version.js
│       └── assets/     # Icônes, patches
├── build/              # Icônes build
├── docs/               # Documentation
└── package.json
```

### Processus Electron

- **Main** : fenêtre principale, tray, gestion des IPC, dialogs, exécution shell (`hdiutil`, `ditto`, etc.)
- **Renderer** : UI (index.html chargé dans BrowserWindow), pas de `nodeIntegration`
- **Preload** : pont sécurisé `contextBridge.exposeInMainWorld('launcher', {...})`

---

## 3. Catalogue d'applications

| Clé | Nom | Type | Description |
|-----|-----|------|-------------|
| `backupflow` | BackUpFlow | Local | Sauvegarde automatisée des rushes — NAS, SSD, cloud |
| `transporter` | Transporter | Local | Transfert et organisation des fichiers Premiere |
| `reviewer` | Reviewer | Web | Validation et annotation des montages en équipe |
| `manifest` | Manifest | Web | Génération des feuilles de service |

**Propriétés par app** : `key`, `name`, `appFileName` (nom du .app dans le DMG), `description`, `motto`, `translation`, `type` (local/web), `repo`, `url` (web), `patch`, `ambiance`, `status`, `tags`.

---

## 4. Système de profils

### Données du profil

- `id` — identifiant unique (ex. `p_1234567890`)
- `firstName`, `lastName`, `email`
- `group` — `cellule` ou `externe`
- `jobRole` — rôle métier (Directeur de cellule, Monteur sénior, etc.)
- `role` — `user`, `co-admin`, `admin`
- `favorites` — apps en favoris
- `appPermissions` — overrides par app : `active`, `vitrine`, `masqué`
- `dmgFolder` — dossier de téléchargement DMG (optionnel, par profil)

### Permissions par défaut

Les permissions par défaut (`DEFAULT_PERMISSIONS`) sont définies selon le `jobRole`. Les admins peuvent les surcharger dans le Mode Master (onglet Équipe).

| Permission | Effet |
|------------|-------|
| `active` | App visible et lançable |
| `vitrine` | App visible mais non lançable (badge « Vitrine ») |
| `masqué` | App invisible pour ce profil |

---

## 5. Modes et écrans

| Écran | Accès | Rôle |
|-------|-------|------|
| **Onboarding** | Premier lancement | Création du premier profil |
| **Profils** | Toujours (header) | Sélection / édition des profils |
| **Dashboard** | Après sélection de profil | Grille d’apps, lancement |
| **Master** | Admin / Co-Admin (mot de passe ou Touch ID) | Administration, équipe, trousseau, sync |

---

## 6. Mode Master

### Onglets

1. **Programme** — Vue d’ensemble (version, phase, profils), liste des apps et statut de mise à jour
2. **Équipe** — Gestion des profils (groupe, rôle, jobRole, permissions par app, dossier DMG)
3. **Trousseau** — Clés API (Monday, Anthropic, Resend, Gofile, GitHub, clés custom)
4. **Synchronisation** — Push/Pull des profils vers le repo GitHub
5. **Système** — Mot de passe admin, réinitialisation onboarding, statut du fichier lock

### Sécurité

- Mot de passe admin (hash SHA-256)
- Code de secours pour récupération
- Touch ID si disponible (macOS)
- Fichier `admin-reset.lock` dans `userData` — suppression = reset du mot de passe

---

## 7. Installation des apps desktop

### Flux

1. **Téléchargement** — `download-app` : télécharge le DMG (GitHub Releases)
   - `destFolder` : dossier visible si défini (ex. `profile.dmgFolder`), sinon `userData/downloads`
   - Progression via IPC `download-progress`

2. **Installation** — `install-app` :
   - Monte le DMG (`hdiutil attach -plist`) pour récupérer le vrai point de montage
   - Cherche le premier `.app` dans le volume
   - Supprime la quarantaine (`xattr -dr com.apple.quarantine`)
   - Copie vers `/Applications` avec `ditto`
   - Détache le volume, supprime le DMG temporaire

3. **Fallback manuel** — Si Gatekeeper bloque : instructions pour glisser-déposer dans Applications, puis `detect-app` pour enregistrer le chemin

### Détection

`detect-app` cherche l’app dans :
- `/Applications/${appName}.app`
- `~/Applications/${appName}.app`

---

## 8. Synchronisation GitHub

- **Pull** au boot : récupère `profiles.json` depuis le repo configuré (`.env` : `PROFILES_REPO`, `GITHUB_TOKEN`)
- **Push** : à chaque `saveConfig` et via le bouton « Pousser vers GitHub » dans Master
- Les rôles locaux (admin, co-admin) sont préservés et ne sont jamais écrasés par le pull

---

## 9. Mises à jour

- **Updater** : interroge l’API GitHub Releases pour chaque repo d’app
- Compare `currentVersion` (stocké) avec `latestVersion` (tag GitHub)
- Fournit `dmgUrl` pour téléchargement et installation
- Notes de version : génération via API Anthropic (Claude) si clé configurée

---

## 10. Handlers IPC principaux

| Handler | Usage |
|---------|-------|
| `get-config`, `save-config` | Config locale |
| `launch-local` | Lancer une app .app |
| `open-url` | Ouvrir une URL (web) |
| `pick-app`, `pick-app-path`, `pick-folder` | Dialogs système |
| `detect-app` | Détecter une app dans Applications |
| `check-for-updates` | Vérifier les mises à jour GitHub |
| `download-app` | Télécharger un DMG |
| `install-app` | Monter, copier, installer .app |
| `sync-profiles-pull`, `sync-profiles-push` | GitHub profils |
| `get-release-notes` | Notes via Anthropic |
| `send-bug-report` | Envoi par Resend |
| `create-admin-lock`, `check-admin-lock`, `touchid-auth` | Admin |
| `quit-app`, `show-window` | Fenêtre |

---

## 11. Configuration (.env)

```
PROFILES_REPO=username/launcher-profiles
GITHUB_TOKEN=ghp_...
```

---

## 12. Chemins système

- **Config** : `userData/config.json`
- **Cache profils** : `userData/profiles-cache.json`
- **Downloads temporaires** : `userData/downloads/` (ou `profile.dmgFolder`)
