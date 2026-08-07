# Déploiement sur le VPS Contabo — À la Source

Site accessible à : **http://158.220.87.172** (aucun domaine, aucun HTTPS — environnement de test partagé).

> ⚠️ Ne partagez votre mot de passe root avec personne. Vous le tapez vous-même à la connexion SSH.

---

## 1. Se connecter au serveur en SSH

Depuis votre PC (PowerShell ou terminal) :

```bash
ssh root@158.220.87.172
```

Tapez `yes` à la première connexion, puis votre mot de passe root Contabo.

---

## 2. Installer Docker (une seule fois)

```bash
curl -fsSL https://get.docker.com | sh
```

Vérifier :

```bash
docker --version && docker compose version
```

---

## 3. Récupérer le code

```bash
cd /opt
git clone https://github.com/githubkhadim66/Projet_a_la_Source.git alasource
cd alasource
```

---

## 4. Créer le fichier de configuration `.env.server`

```bash
cp deploy/.env.server.example .env.server
```

Générer une clé secrète et l'afficher :

```bash
openssl rand -hex 32
```

Puis éditer le fichier :

```bash
nano .env.server
```

Remplacez les 4 valeurs `CHANGEZ_MOI...` :
- `POSTGRES_PASSWORD` : un mot de passe pour la base (ce que vous voulez).
- `SECRET_KEY` : collez la clé générée ci-dessus.
- `FIRST_ADMIN_PASSWORD` : votre mot de passe administrateur.
- `SEED_SUPPLIER_PASSWORD` : mot de passe des comptes fournisseurs de démo.

`PUBLIC_URL` est déjà `http://158.220.87.172`.
Enregistrer : `Ctrl+O`, `Entrée`, puis `Ctrl+X`.

---

## 5. Ouvrir le port 80 (par précaution)

```bash
ufw allow 22/tcp && ufw allow 80/tcp
```

---

## 6. Construire et lancer l'application

```bash
docker compose -f docker-compose.server.yml --env-file .env.server up -d --build
```

La construction prend quelques minutes (frontend + backend). Suivre l'avancement :

```bash
docker compose -f docker-compose.server.yml logs -f backend
```

(quitter les logs avec `Ctrl+C`)

Le backend applique les migrations et crée le compte admin automatiquement.

---

## 7. Charger les 25 produits réels + leurs images

Une fois les conteneurs démarrés :

```bash
docker compose -f docker-compose.server.yml exec backend python -m app.seed_catalogue
docker compose -f docker-compose.server.yml exec backend python scripts/fetch_product_images.py
```

---

## 8. Tester

Ouvrez dans un navigateur : **http://158.220.87.172**

Connexion admin : `/login` → e-mail et mot de passe définis à l'étape 4.

---

## Commandes utiles

| Action | Commande |
|---|---|
| Voir l'état | `docker compose -f docker-compose.server.yml ps` |
| Voir les logs | `docker compose -f docker-compose.server.yml logs -f` |
| Redémarrer | `docker compose -f docker-compose.server.yml restart` |
| Arrêter | `docker compose -f docker-compose.server.yml down` |
| Mettre à jour le code | `git pull && docker compose -f docker-compose.server.yml --env-file .env.server up -d --build` |

Les données (base + images) sont conservées dans des volumes Docker (`pgdata`, `uploads`) et survivent aux redémarrages.
