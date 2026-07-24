from tests.conftest import admin_token, supplier_token


def test_login_rejects_bad_password(seeded):
    client = seeded["client"]
    res = client.post("/api/v1/suppliers/auth/login", json={"email": "a@test.sn", "password": "faux"})
    assert res.status_code == 401


def test_login_rejects_unknown_email(seeded):
    client = seeded["client"]
    res = client.post(
        "/api/v1/suppliers/auth/login", json={"email": "inconnu@nulle-part.fr", "password": "x"}
    )
    assert res.status_code == 401


def test_login_updates_last_login(seeded):
    client = seeded["client"]
    supplier_token(client, "a@test.sn", "mdp-coop-a")
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    suppliers = client.get("/api/v1/admin/suppliers", headers=headers).json()
    coop_a = next(s for s in suppliers if s["email"] == "a@test.sn")
    assert coop_a["last_login_at"] is not None


def test_supplier_sees_only_own_products(seeded):
    client = seeded["client"]
    token = supplier_token(client, "a@test.sn", "mdp-coop-a")
    res = client.get("/api/v1/suppliers/me/products", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    refs = [p["ref"] for p in res.json()]
    assert refs == ["A-001"]


def test_etancheite_frs04_cannot_touch_other_supplier_product(seeded):
    """Test d'étanchéité BLOQUANT (CDC FRS-04) : fournisseur A ne peut ni voir ni modifier
    un produit du fournisseur B — la réponse ne révèle même pas son existence (404)."""
    client = seeded["client"]
    token_a = supplier_token(client, "a@test.sn", "mdp-coop-a")
    res = client.patch(
        f"/api/v1/suppliers/me/products/{seeded['p2']}",
        json={"stock_kg": 0},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 404


def test_supplier_updates_own_stock(seeded):
    client = seeded["client"]
    token = supplier_token(client, "a@test.sn", "mdp-coop-a")
    res = client.patch(
        f"/api/v1/suppliers/me/products/{seeded['p1']}",
        json={"stock_kg": 999, "status": "Rupture", "delay": "À confirmer"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["stock_kg"] == 999
    assert res.json()["status"] == "Rupture"


def test_proposal_enters_validation_queue(seeded):
    client = seeded["client"]
    token = supplier_token(client, "a@test.sn", "mdp-coop-a")
    res = client.post(
        "/api/v1/suppliers/me/proposals",
        json={"name": "Fenugrec bio", "description": "Graines de fenugrec biologiques du Sénégal"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["status"] == "En attente"


def test_products_require_auth(seeded):
    client = seeded["client"]
    assert client.get("/api/v1/suppliers/me/products").status_code == 401


def test_supplier_updates_own_coordinates(seeded):
    """Le fournisseur modifie ses propres coordonnées (FRS-02)."""
    client = seeded["client"]
    token = supplier_token(client, "a@test.sn", "mdp-coop-a")
    res = client.patch(
        "/api/v1/suppliers/me",
        json={"contact_name": "Awa N.", "phone": "+221 77 000 00 00", "city": "Dakar"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["contact_name"] == "Awa N."
    assert body["phone"] == "+221 77 000 00 00"
    assert body["city"] == "Dakar"
    # L'e-mail de connexion reste inchangé (non modifiable par le fournisseur)
    assert body["email"] == "a@test.sn"


def test_admin_creates_supplier_with_temp_password_and_reset(seeded):
    """Le mot de passe temporaire créé par l'admin permet la connexion ; la réinitialisation
    l'invalide et en génère un nouveau."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    res = client.post(
        "/api/v1/admin/suppliers",
        json={"name": "Coop C", "email": "c@test.sn"},
        headers=headers,
    )
    assert res.status_code == 201
    body = res.json()
    temp = body["temp_password"]
    assert len(temp) >= 8

    # Connexion avec le mot de passe temporaire
    assert supplier_token(client, "c@test.sn", temp)

    # Réinitialisation → l'ancien ne marche plus, le nouveau oui
    res = client.post(f"/api/v1/admin/suppliers/{body['id']}/reset-password", headers=headers)
    assert res.status_code == 200
    new_temp = res.json()["temp_password"]
    assert new_temp != temp
    assert client.post(
        "/api/v1/suppliers/auth/login", json={"email": "c@test.sn", "password": temp}
    ).status_code == 401
    assert supplier_token(client, "c@test.sn", new_temp)
