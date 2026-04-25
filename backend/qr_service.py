import qrcode
import uuid
import io
import base64
from datetime import datetime
from backend.supabase_client import get_supabase

class QRService:
    def __init__(self):
        self.supabase = get_supabase()

    def generate_redemption_token(self, user_id: str, merchant_id: str, offer_id: str) -> dict:
        """
        Creates a new redemption record in Supabase and returns the token
        along with a base64 encoded QR code image.
        """
        token = str(uuid.uuid4())
        
        # Insert into Supabase
        try:
            response = self.supabase.table("redemptions").insert({
                "token": token,
                "user_id": user_id,
                "merchant_id": merchant_id,
                "offer_id": offer_id,
                "status": "pending",
                "cashback_eur": 0.00
            }).execute()
        except Exception as e:
            return {"error": str(e)}
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(token)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{img_str}"
        
        data = getattr(response, 'data', response[1] if isinstance(response, tuple) else [])
        
        return {
            "token": token,
            "qr_code_base64": data_uri,
            "record": data[0] if data else None
        }

    def validate_redemption(self, token: str, transaction_amount: float = None) -> dict:
        """
        Validates the token, ensures it's pending, and marks it as redeemed atomically.
        """
        cashback = 0.0
        if transaction_amount:
            cashback = round(transaction_amount * 0.05, 2) # e.g. 5% cashback
            
        try:
            # Atomic update to avoid TOCTOU (Time-of-check to time-of-use) race conditions
            update_resp = self.supabase.table("redemptions").update({
                "status": "redeemed",
                "redeemed_at": datetime.utcnow().isoformat(),
                "cashback_eur": cashback
            }).eq("token", token).eq("status", "pending").execute()
        except Exception as e:
            return {"success": False, "error": str(e)}
        
        updated_records = getattr(update_resp, 'data', update_resp[1] if isinstance(update_resp, tuple) else [])
        
        if not updated_records:
            return {"success": False, "error": "Token not found or already redeemed/expired."}
            
        return {
            "success": True,
            "message": "Successfully redeemed",
            "cashback_awarded": cashback,
            "record": updated_records[0]
        }
