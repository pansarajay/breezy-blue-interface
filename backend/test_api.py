import urllib.request
import json

def test_api():
    print("Verifying Flask Backend Health API...")
    try:
        response = urllib.request.urlopen("http://localhost:5000/api/health", timeout=3)
        data = json.loads(response.read().decode())
        print(f"Health check response: {data}")
        assert data['status'] == 'healthy'
        print("Health Check: PASSED")
    except Exception as e:
        print(f"Health Check: FAILED ({e})")
        return

    print("\nTesting User Login API (admin@busgo.com)...")
    try:
        req = urllib.request.Request(
            "http://localhost:5000/api/auth/login",
            data=json.dumps({"email": "admin@busgo.com", "password": "admin123"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        response = urllib.request.urlopen(req, timeout=3)
        data = json.loads(response.read().decode())
        print("Login successful! Received token.")
        token = data['token']
        print("Login: PASSED")
    except Exception as e:
        print(f"Login: FAILED ({e})")
        return

    print("\nTesting Search Buses API...")
    try:
        import datetime
        date_str = datetime.date.today().strftime('%Y-%m-%d')
        url = f"http://localhost:5000/api/buses/search?from=Bengaluru&to=Mumbai&date={date_str}"
        response = urllib.request.urlopen(url, timeout=3)
        data = json.loads(response.read().decode())
        print(f"Found {len(data)} buses running Bengaluru -> Mumbai on {date_str}.")
        assert len(data) > 0
        schedule_id = data[0]['schedule_id']
        print("Search Buses: PASSED")
    except Exception as e:
        print(f"Search Buses: FAILED ({e})")
        return

    print("\nTesting Seat Layout API for schedule...")
    try:
        url = f"http://localhost:5000/api/buses/schedule/{schedule_id}/seats"
        response = urllib.request.urlopen(url, timeout=3)
        data = json.loads(response.read().decode())
        print(f"Fetched layout. Total seats returned: {len(data['seats'])}.")
        assert len(data['seats']) > 0
        print("Seat Layout: PASSED")
    except Exception as e:
        print(f"Seat Layout: FAILED ({e})")
        return

    print("\nALL API BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_api()
