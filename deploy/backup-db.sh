#!/usr/bin/env bash
# Sauvegarde quotidienne des bases Postgres (prod + staging), rétention 14 jours.
# À placer sur le serveur (ex. /opt/alasource-backup-db.sh) et à lancer via cron.
#   chmod +x /opt/alasource-backup-db.sh
#   (crontab -l 2>/dev/null; echo "30 2 * * * /opt/alasource-backup-db.sh >> /var/log/alasource-backup.log 2>&1") | crontab -
set -euo pipefail

BACKUP_DIR=/opt/alasource-backups
RETENTION_DAYS=14
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

dump() {  # $1=nom  $2=dossier  $3=fichier-compose  $4=fichier-env
  local name=$1 dir=$2 compose=$3 env=$4
  [ -d "$dir" ] && [ -f "$dir/$env" ] || { echo "SKIP $name (absent)"; return 0; }
  local user db
  user=$(grep -E '^POSTGRES_USER=' "$dir/$env" | cut -d= -f2)
  db=$(grep -E '^POSTGRES_DB=' "$dir/$env" | cut -d= -f2)
  ( cd "$dir" && docker compose -f "$compose" --env-file "$env" exec -T db \
      pg_dump -U "${user:-alasource}" "${db:-alasource}" ) \
    | gzip > "$BACKUP_DIR/$name-$STAMP.sql.gz"
  echo "OK   $name -> $BACKUP_DIR/$name-$STAMP.sql.gz"
}

dump prod    /opt/alasource-prod    docker-compose.prod.yml    .env.prod
dump staging /opt/alasource-staging docker-compose.staging.yml .env.staging

# Rotation : supprime les dumps de plus de RETENTION_DAYS jours
find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Rotation OK (> $RETENTION_DAYS j supprimés)."
