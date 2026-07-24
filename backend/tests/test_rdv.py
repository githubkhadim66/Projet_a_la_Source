RDV = {
    "duration_minutes": 30,
    "motif": "Projet d'importation",
    "day": "2026-07-20",
    "slot": "09:00",
    "name": "Marie Dupont",
    "company": "Épicerie du Marché",
    "email": "m.dupont@epicerie.fr",
}


def test_book_rdv(client):
    res = client.post("/api/v1/rdv", json=RDV)
    assert res.status_code == 201
    assert res.json()["status"] == "confirmé"


def test_double_booking_conflict(client):
    assert client.post("/api/v1/rdv", json=RDV).status_code == 201
    res = client.post("/api/v1/rdv", json=RDV)
    assert res.status_code == 409


def test_slots_exclude_taken(client):
    client.post("/api/v1/rdv", json=RDV)
    res = client.get("/api/v1/rdv/slots", params={"day": "2026-07-20"})
    assert res.status_code == 200
    assert "09:00" not in res.json()["slots"]
    assert "09:30" in res.json()["slots"]
