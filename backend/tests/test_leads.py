CATALOGUE_PAYLOAD = {
    "first_name": "Marie",
    "last_name": "Dupont",
    "company": "Épicerie du Marché SAS",
    "email": "m.dupont@epicerie.fr",
    "country": "France",
    "rgpd_consent": True,
}


def test_catalogue_lead_creates_lead_and_signed_link(client):
    res = client.post("/api/v1/leads/catalogue", json=CATALOGUE_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["id"] > 0
    assert "token=" in body["download_url"]


def test_catalogue_requires_rgpd_consent(client):
    res = client.post("/api/v1/leads/catalogue", json={**CATALOGUE_PAYLOAD, "rgpd_consent": False})
    assert res.status_code == 422


def test_honeypot_rejects_bots(client):
    res = client.post("/api/v1/leads/catalogue", json={**CATALOGUE_PAYLOAD, "website": "spam.com"})
    assert res.status_code == 400


def test_devis_lead(client):
    res = client.post("/api/v1/leads/devis", json={
        "company": "SARL Import Europe",
        "contact": "Marie Dupont — Responsable achats",
        "email": "contact@entreprise.fr",
        "country": "France",
        "products": ["Hibiscus séché", "Poudre de baobab"],
        "volume": "12 tonnes",
        "incoterm": "CIF",
        "certifications": ["Bio UE", "HACCP"],
        "transport_needed": True,
    })
    assert res.status_code == 201


def test_sourcing_lead(client):
    res = client.post("/api/v1/leads/sourcing", json={
        "company": "SARL Import Europe",
        "contact": "Jean Martin",
        "email": "j.martin@entreprise.fr",
        "country": "Belgique",
        "product": "Beurre de karité raffiné",
        "description": "Usage cosmétique, conditionnement 25 kg",
        "quality_level": "Premium",
    })
    assert res.status_code == 201


def test_candidature_lead(client):
    res = client.post("/api/v1/leads/candidature", json={
        "company": "Coopérative Kaydara",
        "contact_name": "Amadou Diallo",
        "email": "contact@coop.sn",
        "country": "Sénégal",
        "product_types": ["Épicerie"],
        "rgpd_consent": True,
    })
    assert res.status_code == 201


def test_catalogue_download_rejects_invalid_token(client):
    res = client.get("/api/v1/catalogue/download", params={"token": "forged"})
    assert res.status_code == 403


def test_catalogue_download_marks_lead_as_downloaded(seeded):
    """Le téléchargement réussi bascule automatiquement le lead en « Téléchargé » (suivi de conversion)."""
    from tests.conftest import admin_token

    client = seeded["client"]
    # Un produit du catalogue existe (fixture seeded) → le PDF peut être généré
    created = client.post("/api/v1/leads/catalogue", json=CATALOGUE_PAYLOAD).json()
    lead_id, url = created["id"], created["download_url"]

    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    before = next(x for x in client.get("/api/v1/admin/leads", headers=headers).json() if x["id"] == lead_id)
    assert before["status"] == "Nouveau"
    assert before["catalogue_downloaded_at"] is None

    # Téléchargement via le lien signé (on retire le préfixe /api/v1 déjà porté par le client de test)
    token = url.split("token=")[1]
    res = client.get("/api/v1/catalogue/download", params={"token": token})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"

    after = next(x for x in client.get("/api/v1/admin/leads", headers=headers).json() if x["id"] == lead_id)
    assert after["status"] == "Téléchargé"
    assert after["catalogue_downloaded_at"] is not None
    assert after["catalogue_download_count"] == 1


def test_catalogue_download_keeps_admin_manual_status(seeded):
    """Si l'admin a déjà fait progresser le lead, un téléchargement n'écrase pas son statut."""
    from tests.conftest import admin_token

    client = seeded["client"]
    created = client.post("/api/v1/leads/catalogue", json=CATALOGUE_PAYLOAD).json()
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    client.patch(f"/api/v1/admin/leads/{created['id']}", json={"status": "Traité"}, headers=headers)

    client.get("/api/v1/catalogue/download", params={"token": created["download_url"].split("token=")[1]})

    after = next(x for x in client.get("/api/v1/admin/leads", headers=headers).json() if x["id"] == created["id"])
    assert after["status"] == "Traité"                       # progression manuelle préservée
    assert after["catalogue_downloaded_at"] is not None      # mais le téléchargement reste tracé
