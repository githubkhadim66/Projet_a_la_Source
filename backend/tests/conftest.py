import os

os.environ["DATABASE_URL"] = "sqlite:///./test_alasource.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["EMAIL_BACKEND"] = "console"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import AdminUser, Product, StockStatus, Supplier  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def seeded(client):
    """Admin + 2 fournisseurs avec chacun un produit (pour le test d'étanchéité FRS-04)."""
    db = SessionLocal()
    try:
        db.add(AdminUser(email="admin@test.fr", hashed_password=hash_password("secret123")))
        s1 = Supplier(name="Coop A", email="a@test.sn", hashed_password=hash_password("mdp-coop-a"))
        s2 = Supplier(name="Coop B", email="b@test.sn", hashed_password=hash_password("mdp-coop-b"))
        db.add_all([s1, s2])
        db.flush()
        p1 = Product(supplier_id=s1.id, ref="A-001", name="Karité", stock_kg=100,
                     status=StockStatus.EN_STOCK, delay="2 semaines")
        p2 = Product(supplier_id=s2.id, ref="B-001", name="Cajou", stock_kg=200,
                     status=StockStatus.EN_STOCK, delay="1 semaine")
        db.add_all([p1, p2])
        db.commit()
        ids = {"s1": s1.id, "s2": s2.id, "p1": p1.id, "p2": p2.id}
    finally:
        db.close()
    return {"client": client, **ids}


def supplier_token(client, email: str, password: str) -> str:
    res = client.post("/api/v1/suppliers/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def admin_token(client) -> str:
    res = client.post("/api/v1/admin/auth/login", json={"email": "admin@test.fr", "password": "secret123"})
    assert res.status_code == 200
    return res.json()["access_token"]
