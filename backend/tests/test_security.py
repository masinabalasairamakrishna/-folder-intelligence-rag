from app.core.security import create_access_token
from app.rag.vector_store import vector_store

def test_cross_user_folder_access_blocked(client, db_session):
    from app.models.user import User
    from app.models.folder import Folder
    from app.core.security import get_password_hash

    # Create User A
    user_a = User(name="User A", email="usera@univ.edu", password_hash=get_password_hash("pass"))
    # Create User B
    user_b = User(name="User B", email="userb@univ.edu", password_hash=get_password_hash("pass"))
    db_session.add_all([user_a, user_b])
    db_session.commit()

    # User A creates folder
    folder_a = Folder(user_id=user_a.id, name="User A Confidential Notes")
    db_session.add(folder_a)
    db_session.commit()

    # User B attempts to access User A's folder
    token_b = create_access_token(subject=user_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = client.get(f"/api/folders/{folder_a.id}", headers=headers_b)
    assert response.status_code == 404  # Isolated per user, not found for User B

def test_cross_user_vector_isolation():
    user_1 = 5551
    user_2 = 5552

    # Insert vector for User 1
    vector_store.add_chunks(
        chunk_ids=[f"sec_{user_1}_0"],
        texts=["Secret proprietary algorithm designed exclusively for User 1."],
        metadatas=[{"user_id": str(user_1), "filename": "secret.txt"}]
    )

    # User 2 searches for "proprietary algorithm"
    results = vector_store.search(
        query="proprietary algorithm",
        user_id=user_2,
        top_k=5
    )

    # User 2 must NOT see User 1's vector
    assert len(results) == 0

    # User 1 searches and finds it
    results_user_1 = vector_store.search(
        query="proprietary algorithm",
        user_id=user_1,
        top_k=5
    )
    assert len(results_user_1) == 1
    assert "User 1" in results_user_1[0]["text"]
