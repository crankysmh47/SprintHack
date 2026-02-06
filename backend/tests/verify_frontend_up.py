import requests
import time

def verify_frontend():
    url = "http://localhost:3000"
    print(f"🕵️ Checking Frontend at {url}...")
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is UP and reachable!")
            print(f"   Status Code: {response.status_code}")
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Refused. Server might not be running.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    verify_frontend()
