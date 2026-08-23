import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from extensions import db
from models.user import User

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_patient_signup(client):
    res = client.post('/api/auth/signup', json={
        "name": "Test Patient",
        "email": "patient@test.com",
        "phone": "9998887770",
        "password": "password123",
        "confirm_password": "password123"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"

def test_login(client):
    # Register first
    client.post('/api/auth/signup', json={
        "name": "Test Patient",
        "email": "patient@test.com",
        "phone": "9998887770",
        "password": "password123",
        "confirm_password": "password123"
    })

    res = client.post('/api/auth/login', json={
        "email": "patient@test.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"
