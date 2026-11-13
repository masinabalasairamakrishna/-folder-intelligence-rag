def test_create_folder(client, auth_headers):
    response = client.post("/api/folders", json={
        "name": "Machine_Learning_Project",
        "description": "Folder containing ML research papers and notes"
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Machine_Learning_Project"
    assert "id" in data

def test_list_folders(client, auth_headers):
    response = client.get("/api/folders", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1

def test_get_folder_detail(client, auth_headers):
    # Create folder
    res = client.post("/api/folders", json={"name": "DBMS_Study"}, headers=auth_headers)
    folder_id = res.json()["id"]

    # Get details
    response = client.get(f"/api/folders/{folder_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == folder_id
    assert "documents" in data

def test_update_folder(client, auth_headers):
    res = client.post("/api/folders", json={"name": "Old_Name"}, headers=auth_headers)
    folder_id = res.json()["id"]

    response = client.patch(f"/api/folders/{folder_id}", json={
        "name": "Updated_Folder_Name"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated_Folder_Name"

def test_delete_folder(client, auth_headers):
    res = client.post("/api/folders", json={"name": "To_Delete"}, headers=auth_headers)
    folder_id = res.json()["id"]

    del_res = client.delete(f"/api/folders/{folder_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify not found
    get_res = client.get(f"/api/folders/{folder_id}", headers=auth_headers)
    assert get_res.status_code == 404
