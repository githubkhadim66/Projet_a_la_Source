from tests.conftest import admin_token


def test_login_rejects_bad_password(seeded):
    client = seeded["client"]
    res = client.post("/api/v1/admin/auth/login", json={"email": "admin@test.fr", "password": "wrong"})
    assert res.status_code == 401


def test_dashboard_counters(seeded):
    client = seeded["client"]
    token = admin_token(client)
    client.post("/api/v1/leads/devis", json={
        "company": "X", "contact": "Y", "email": "x@y.fr", "country": "France", "products": ["Karité"],
    })
    res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["leads"]["devis"] == 1
    assert body["suppliers_active"] == 2


def test_leads_queue_filter_and_status_update(seeded):
    client = seeded["client"]
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/leads/candidature", json={
        "company": "Coop Z", "contact_name": "A", "email": "a@z.sn", "country": "Mali", "rgpd_consent": True,
    })
    res = client.get("/api/v1/admin/leads", params={"queue": "candidatures"}, headers=headers)
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) == 1
    lead_id = leads[0]["id"]

    res = client.patch(f"/api/v1/admin/leads/{lead_id}", json={"status": "En cours"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "En cours"


def test_admin_endpoints_require_auth(seeded):
    client = seeded["client"]
    assert client.get("/api/v1/admin/leads").status_code == 401
    assert client.get("/api/v1/admin/dashboard").status_code == 401


def test_delete_lead_rgpd(seeded):
    """SEC-03 : suppression d'un lead sur demande."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    client.post("/api/v1/leads/devis", json={
        "company": "X", "contact": "Y", "email": "x@y.fr", "country": "France", "products": ["Karité"],
    })
    lead_id = client.get("/api/v1/admin/leads", headers=headers).json()[0]["id"]
    assert client.delete(f"/api/v1/admin/leads/{lead_id}", headers=headers).status_code == 204
    assert client.get("/api/v1/admin/leads", headers=headers).json() == []


def test_cancel_appointment_frees_slot(seeded):
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    rdv = {"duration_minutes": 30, "day": "2026-08-03", "slot": "09:00",
           "name": "M. Test", "company": "Test SARL", "email": "t@t.fr"}
    appt_id = client.post("/api/v1/rdv", json=rdv).json()["id"]
    res = client.patch(f"/api/v1/admin/appointments/{appt_id}", json={"status": "annulé"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "annulé"
    # Le créneau redevient réservable
    assert "09:00" in client.get("/api/v1/rdv/slots", params={"day": "2026-08-03"}).json()["slots"]


def test_csv_exports(seeded):
    """REF-04 : export complet des données en CSV."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    for dataset in ["leads", "products", "suppliers"]:
        res = client.get(f"/api/v1/admin/export/{dataset}", headers=headers)
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
    assert "A-001" in client.get("/api/v1/admin/export/products", headers=headers).text


def test_remind_supplier_stock(seeded):
    """FRS-05 : relance des références non actualisées."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    # Produits fraîchement créés → rien à relancer
    res = client.post(f"/api/v1/admin/suppliers/{seeded['s1']}/remind-stock", headers=headers)
    assert res.status_code == 200
    assert res.json()["count"] == 0


def test_product_archive_restore_and_purge(seeded):
    """La corbeille ne perd jamais un produit : archiver = réversible, supprimer exige l'archivage."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    pid = seeded["p1"]

    # Suppression directe interdite tant que le produit n'est pas archivé
    assert client.delete(f"/api/v1/admin/products/{pid}", headers=headers).status_code == 409

    # Archiver : le produit disparaît de la liste active et du catalogue public
    res = client.post(f"/api/v1/admin/products/{pid}/archive", headers=headers)
    assert res.status_code == 200
    assert res.json()["archived_at"] is not None
    assert pid not in [p["id"] for p in client.get("/api/v1/admin/products", headers=headers).json()]
    assert pid in [p["id"] for p in client.get("/api/v1/admin/products?archived=true", headers=headers).json()]
    assert "A-001" not in [p["ref"] for p in client.get("/api/v1/catalogue/produits").json()]

    # Restaurer : le produit revient parmi les actifs
    res = client.post(f"/api/v1/admin/products/{pid}/restore", headers=headers)
    assert res.status_code == 200
    assert res.json()["archived_at"] is None
    assert pid in [p["id"] for p in client.get("/api/v1/admin/products", headers=headers).json()]

    # Suppression définitive : possible seulement après un nouvel archivage
    client.post(f"/api/v1/admin/products/{pid}/archive", headers=headers)
    assert client.delete(f"/api/v1/admin/products/{pid}", headers=headers).status_code == 204
    assert client.get("/api/v1/admin/products?archived=true", headers=headers).json() == []


def test_admin_creates_supplier_and_product(seeded):
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    res = client.post("/api/v1/admin/suppliers", json={"name": "Coop C", "email": "c@test.sn"}, headers=headers)
    assert res.status_code == 201
    sid = res.json()["id"]
    res = client.post("/api/v1/admin/products", json={
        "supplier_id": sid, "ref": "C-001", "name": "Bissap", "stock_kg": 500,
    }, headers=headers)
    assert res.status_code == 201
