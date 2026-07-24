"""Vérifie l'instance Postgres locale (port 5433) : bases présentes + contenu d'alasource."""

import psycopg

conn = psycopg.connect(
    host="localhost", port=5433, user="postgres", password="    ", dbname="postgres"
)
port = conn.execute("SHOW port").fetchone()[0]
dbs = [r[0] for r in conn.execute("SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY 1")]
print(f"Instance port {port} — bases : {', '.join(dbs)}")
conn.close()

if "alasource" in dbs:
    c2 = psycopg.connect(host="localhost", port=5433, user="postgres", password="    ", dbname="alasource")
    tables = [r[0] for r in c2.execute(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1"
    )]
    print(f"Tables d'alasource : {', '.join(tables)}")
    n_prod = c2.execute("SELECT count(*) FROM products").fetchone()[0]
    n_admin = c2.execute("SELECT count(*) FROM admin_users").fetchone()[0]
    print(f"Produits : {n_prod} — Admins : {n_admin}")
    c2.close()
