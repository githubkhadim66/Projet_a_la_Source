"""Crée la base `alasource` sur le Postgres local si elle n'existe pas."""

import psycopg

conn = psycopg.connect(
    host="localhost", port=5433, user="postgres", password="    ", dbname="postgres", autocommit=True
)
exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = 'alasource'").fetchone()
if exists:
    print("Base 'alasource' : existe déjà")
else:
    conn.execute("CREATE DATABASE alasource")
    print("Base 'alasource' : créée")
conn.close()
