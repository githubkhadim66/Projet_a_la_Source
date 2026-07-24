from tests.conftest import admin_token


def test_unified_login_detects_admin(seeded):
    client = seeded["client"]
    res = client.post("/api/v1/auth/login", json={"email": "admin@test.fr", "password": "secret123"})
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "admin"
    assert body["access_token"]


def test_unified_login_detects_supplier(seeded):
    client = seeded["client"]
    res = client.post("/api/v1/auth/login", json={"email": "a@test.sn", "password": "mdp-coop-a"})
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "supplier"
    assert body["must_change_password"] is False


def test_unified_login_rejects_bad_credentials(seeded):
    client = seeded["client"]
    res = client.post("/api/v1/auth/login", json={"email": "a@test.sn", "password": "faux"})
    assert res.status_code == 401


def test_first_login_flow_and_password_change(seeded):
    """Compte créé par l'admin → must_change_password=True ; après changement → False
    et le nouveau mot de passe fonctionne."""
    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    created = client.post(
        "/api/v1/admin/suppliers", json={"name": "Coop D", "email": "d@test.sn"}, headers=headers
    ).json()
    temp = created["temp_password"]

    # Première connexion : le changement de mot de passe est proposé
    res = client.post("/api/v1/auth/login", json={"email": "d@test.sn", "password": temp})
    assert res.status_code == 200
    assert res.json()["must_change_password"] is True
    token = res.json()["access_token"]

    # Mauvais mot de passe actuel refusé
    res = client.post(
        "/api/v1/suppliers/me/password",
        json={"current_password": "faux", "new_password": "nouveau-mdp-123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 401

    # Changement effectif
    res = client.post(
        "/api/v1/suppliers/me/password",
        json={"current_password": temp, "new_password": "nouveau-mdp-123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200

    # L'ancien ne marche plus, le nouveau oui, et le drapeau est retombé
    assert client.post(
        "/api/v1/auth/login", json={"email": "d@test.sn", "password": temp}
    ).status_code == 401
    res = client.post("/api/v1/auth/login", json={"email": "d@test.sn", "password": "nouveau-mdp-123"})
    assert res.status_code == 200
    assert res.json()["must_change_password"] is False
