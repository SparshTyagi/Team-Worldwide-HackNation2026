import os
import sys

# Ensure the parent directory is in the path so we can import 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.supabase_client import get_supabase
from backend.qr_service import QRService

def run_tests():
    print("--- Starting Backend Tests ---")
    
    # 1. Test Supabase Connection
    print("\n1. Testing Supabase Connection...")
    try:
        supabase = get_supabase()
        print("[OK] Supabase client initialized successfully.")
    except Exception as e:
        print(f"[ERR] Failed to initialize Supabase: {e}")
        return

    # 2. Setup mock data for foreign key constraints
    print("\n2. Setting up mock data (User & Merchant)...")
    try:
        # Insert a dummy user
        user_res = supabase.table("users").insert({"pseudonym": "test_user_001"}).execute()
        user_data = getattr(user_res, 'data', user_res[1] if isinstance(user_res, tuple) else [])
        user_id = user_data[0]["id"]
        
        # Insert a dummy merchant
        merch_res = supabase.table("merchants").insert({
            "name": "Test Cafe",
            "category": "Cafe"
        }).execute()
        merch_data = getattr(merch_res, 'data', merch_res[1] if isinstance(merch_res, tuple) else [])
        merchant_id = merch_data[0]["id"]
        
        print(f"[OK] Mock User ID: {user_id}")
        print(f"[OK] Mock Merchant ID: {merchant_id}")
    except Exception as e:
        print(f"[ERR] Failed to setup mock data: {e}")
        print("   -> Did you run the SQL script in Supabase?")
        return

    # 3. Test QR Service Generation
    print("\n3. Testing QR Token Generation...")
    qr_service = QRService()
    try:
        gen_result = qr_service.generate_redemption_token(
            user_id=user_id,
            merchant_id=merchant_id,
            offer_id="test_offer_abc"
        )
        if "error" in gen_result:
            print(f"[ERR] Error generating token: {gen_result['error']}")
            return
            
        token = gen_result["token"]
        print(f"[OK] Token generated: {token}")
        print(f"[OK] QR Code Data URI created (length: {len(gen_result['qr_code_base64'])} chars)")
    except Exception as e:
        print(f"[ERR] Failed to generate token: {e}")
        return

    # 4. Test QR Service Validation
    print("\n4. Testing Token Validation (Redemption)...")
    try:
        val_result = qr_service.validate_redemption(token, transaction_amount=15.00)
        if val_result.get("success"):
            print(f"[OK] Successfully redeemed token!")
            print(f"[OK] Cashback awarded: €{val_result.get('cashback_awarded')}")
        else:
            print(f"[ERR] Validation failed: {val_result.get('error')}")
            
        # Try validating again to ensure TOCTOU/Double-spend prevention works
        print("   Testing double-spend prevention...")
        val_result_2 = qr_service.validate_redemption(token, transaction_amount=15.00)
        if not val_result_2.get("success"):
            print(f"[OK] Double-spend correctly prevented! Reason: {val_result_2.get('error')}")
        else:
            print("[ERR] WARNING: Double-spend was allowed!")
    except Exception as e:
        print(f"[ERR] Failed during validation: {e}")

    # 5. Cleanup
    print("\n5. Cleaning up mock data...")
    try:
        supabase.table("users").delete().eq("id", user_id).execute()
        supabase.table("merchants").delete().eq("id", merchant_id).execute()
        print("[OK] Cleanup successful (redemptions cascade deleted).")
    except Exception as e:
        print(f"[ERR] Failed to cleanup: {e}")

    print("\n--- All Backend Tests Completed ---")

if __name__ == "__main__":
    run_tests()
