from app.core.security import verify_password

def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "name": "Priya Sharma",
        "email": "priya.ai@university.edu",
        "password": "securepassword123"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "priya.ai@university.edu"

def test_duplicate_email_registration_fails(client):
    # Register first time
    client.post("/api/auth/register", json={
        "name": "Duplicate Test",
        "email": "dup@university.edu",
        "password": "password123"
    })
    # Register duplicate
    response = client.post("/api/auth/register", json={
        "name": "Duplicate Test 2",
        "email": "dup@university.edu",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_login_success(client):
    # Register
    client.post("/api/auth/register", json={
        "name": "Login User",
        "email": "login_user@university.edu",
        "password": "mypassword123"
    })
    # Login
    response = client.post("/api/auth/login", json={
        "email": "login_user@university.edu",
        "password": "mypassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login_user@university.edu"

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "email": "login_user@university.edu",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == test_user.email
