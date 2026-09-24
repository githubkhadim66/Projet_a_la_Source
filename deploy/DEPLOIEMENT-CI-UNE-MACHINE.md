# Déploiement CI — Prod + Staging sur une seule machine (Contabo)

Objectif : **prod** et **staging** sur le **même VPS** (158.220.87.172), déployés
**automatiquement** par GitHub Actions.

| Environnement | Branche / déclencheur | Dossier serveur | Accès (HTTP temporaire) |
|---|---|---|---|
| **Staging** | push sur `develop` | `/opt/alasource-staging` | `http://158.220.87.172:8080` |
| **Production** | tag `vX.Y.Z` (ou « Run workflow ») | `/opt/alasource-prod` | `http://158.220.87.172` (port 80) |

> HTTPS viendra avec le nom de domaine (voir la dernière section). Pour l'instant, tout est en HTTP.
> Les images sont construites par le CI et publiées sur GHCR ; le serveur ne fait que les **télécharger** (pas de build sur la machine).

---

## 1. Préparer le serveur (une seule fois)

Se connecter : `ssh root@158.220.87.172`

Installer Docker (si pas déjà fait) puis git :
```bash
curl -fsSL https://get.docker.com | sh
apt-get update && apt-get install -y git
```

Ouvrir les ports :
```bash
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 8080/tcp
```

Cloner le dépôt dans **deux dossiers** (prod sur `main`, staging sur `develop`) :
```bash
git clone https://github.com/githubkhadim66/Projet_a_la_Source.git /opt/alasource-prod
git -C /opt/alasource-prod checkout main

git clone https://github.com/githubkhadim66/Projet_a_la_Source.git /opt/alasource-staging
git -C /opt/alasource-staging checkout develop
```
> Si la branche `develop` n'existe pas encore, crée-la depuis `main` (voir §5).

Créer les fichiers `.env` (à partir des exemples), puis les compléter :
```bash
cp /opt/alasource-prod/deploy/.env.prod.example        /opt/alasource-prod/.env.prod
cp /opt/alasource-staging/deploy/.env.staging.example  /opt/alasource-staging/.env.staging
openssl rand -hex 32     # génère un SECRET_KEY (une fois par environnement)
nano /opt/alasource-prod/.env.prod        # remplir les <...> (mots de passe, SECRET_KEY, admin)
nano /opt/alasource-staging/.env.staging  # idem, avec des mots de passe DIFFÉRENTS
```

---

## 2. Créer une clé SSH de déploiement (sur ton PC)

```bash
ssh-keygen -t ed25519 -C "deploy-alasource" -f alasource_deploy -N ""
```
- Copier la **clé publique** sur le serveur :
  ```bash
  ssh-copy-id -i alasource_deploy.pub root@158.220.87.172
  # (ou coller le contenu de alasource_deploy.pub dans /root/.ssh/authorized_keys)
  ```
- La **clé privée** (`alasource_deploy`, tout le contenu) ira dans les secrets GitHub (§3).

---

## 3. Secrets GitHub à créer

Dans GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
La prod et le staging pointent vers **la même machine**, seuls le dossier et l'URL changent :

| Secret | Valeur |
|---|---|
| `PROD_HOST` | `158.220.87.172` |
| `PROD_USER` | `root` |
| `PROD_SSH_KEY` | *(contenu de la clé privée `alasource_deploy`)* |
| `PROD_APP_DIR` | `/opt/alasource-prod` |
| `PROD_URL` | `http://158.220.87.172` |
| `STAGING_HOST` | `158.220.87.172` |
| `STAGING_USER` | `root` |
| `STAGING_SSH_KEY` | *(la même clé privée)* |
| `STAGING_APP_DIR` | `/opt/alasource-staging` |
| `STAGING_URL` | `http://158.220.87.172:8080` |

> Les images GHCR sont téléchargées avec le jeton automatique du workflow — **pas besoin** de créer un token GHCR ni de rendre les images publiques.

*(Optionnel)* GitHub → Settings → **Environments** → créer `production` et `staging` ;
sur `production`, activer « Required reviewers » pour exiger une **approbation manuelle** avant chaque mise en prod.

---

## 4. Premier démarrage

Le plus simple pour le tout premier lancement : le faire tourner **une fois à la main** sur le serveur
(ensuite tout passera par le CI).

```bash
# Staging
cd /opt/alasource-staging
echo "$CR_PAT" | docker login ghcr.io -u githubkhadim66 --password-stdin   # voir note ci-dessous
docker compose -f docker-compose.staging.yml --env-file .env.staging pull
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d

# Production
cd /opt/alasource-prod
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
> Note login manuel : pour un `pull` manuel des images, connecte-toi à GHCR avec un **Personal Access Token**
> (classique, portée `read:packages`) : `export CR_PAT=<ton_token>`. Via le CI, cette étape est automatique.
> Alternative : après le tout premier déclenchement du CI (§5), le CI aura déjà fait le `up` — tu peux sauter cette étape manuelle.

Les migrations et le compte admin se créent automatiquement au démarrage du backend.

---

## 5. Déclencher les déploiements (au quotidien)

**Staging** — automatique à chaque push sur `develop` :
```bash
git checkout -b develop        # la première fois seulement
git push -u origin develop     # déclenche le déploiement staging
# ensuite : git push origin develop  à chaque mise à jour
```

**Production** — sur un **tag de version** (ou manuellement) :
```bash
git checkout main && git pull
git tag v1.0.0
git push origin v1.0.0         # déclenche le déploiement production
```
Ou dans GitHub → **Actions → Deploy — Production → Run workflow**.

Suivre l'avancement dans l'onglet **Actions**. Le workflow finit par un *smoke test* sur `/api/v1/health`.

---

## 6. Sauvegarde de la base (recommandé)

Copier le script et le programmer en cron quotidien :
```bash
cp /opt/alasource-prod/deploy/backup-db.sh /opt/alasource-backup-db.sh
chmod +x /opt/alasource-backup-db.sh
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/alasource-backup-db.sh >> /var/log/alasource-backup.log 2>&1") | crontab -
```
Les dumps horodatés (prod + staging) atterrissent dans `/opt/alasource-backups` (rétention 14 jours).

---

## 7. Domaine funtiworld.com + HTTPS

Prod : `funtiworld.com` (+ `www`) · Staging : `staging.funtiworld.com`. Un seul Caddy (celui de la prod)
sert les deux et obtient les certificats Let's Encrypt **automatiquement**.

1. DNS (OVH › Domaines › funtiworld.com › Zone DNS) : enregistrements **A** vers `158.220.87.172`
   pour `funtiworld.com`, `www.funtiworld.com` et `staging.funtiworld.com` (supprimer les A/AAAA d'OVH existants).
2. Dans `/opt/alasource-prod/.env.prod` :
   ```
   DOMAIN=funtiworld.com, www.funtiworld.com
   STAGING_DOMAIN=staging.funtiworld.com
   CORS_ORIGINS=https://funtiworld.com,https://www.funtiworld.com
   FRONTEND_URL=https://funtiworld.com
   ```
3. Dans `/opt/alasource-staging/.env.staging` :
   ```
   CORS_ORIGINS=https://staging.funtiworld.com,http://158.220.87.172:8080
   FRONTEND_URL=https://staging.funtiworld.com
   ```
4. Relancer les deux (`up -d`), puis mettre à jour les secrets GitHub `PROD_URL=https://funtiworld.com`
   et `STAGING_URL=https://staging.funtiworld.com`.

---

## Dépannage

| Symptôme | Piste |
|---|---|
| Le workflow échoue au `docker login`/`pull` | Vérifier les permissions `packages: read` (déjà dans le CI) et que le dépôt est bien le tien |
| SSH refusé dans Actions | La clé **publique** est-elle dans `authorized_keys` du serveur ? La clé **privée** complète est-elle dans le secret ? |
| Backend en boucle de redémarrage | `docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=50 backend` |
| Conflit de port 80 | Un seul service doit prendre le 80 (Caddy prod). Staging est sur 8080. |
| Impossible de se connecter en admin | Vérifier `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD` dans le `.env` correspondant |
