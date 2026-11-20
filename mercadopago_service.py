import requests
import json
import logging
from database import get_setting

logger = logging.getLogger(__name__)

MP_API_BASE = "https://api.mercadopago.com"

def create_mp_preference(reservation, excursion, host_url):
    """
    Creates a Mercado Pago Checkout Pro Preference using official REST API.
    If no MP_ACCESS_TOKEN is configured in settings or environment,
    provides a demo/test checkout mode so the site is 100% testable out of the box.
    """
    access_token = get_setting("mp_access_token", "").strip()

    # Split name into first and last name
    name_parts = reservation["customer_name"].strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    success_url = f"{host_url}/reserva/confirmacion?code={reservation['code']}&status=approved"
    pending_url = f"{host_url}/reserva/confirmacion?code={reservation['code']}&status=pending"
    failure_url = f"{host_url}/reserva/confirmacion?code={reservation['code']}&status=failure"
    webhook_url = f"{host_url}/api/mercadopago/webhook"

    if not access_token:
        # Fallback to simulated checkout flow for immediate demo testing
        return {
            "success": True,
            "mode": "simulation",
            "preference_id": f"SIM-{reservation['code']}",
            "init_point": f"/checkout/simulado?code={reservation['code']}",
            "message": "Token de Mercado Pago no configurado. Se abrió el simulador de prueba."
        }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Item details
    item_title = f"Merlo Aventura - {excursion['name']}"
    item_desc = f"{reservation['total_passengers']} pasajeros ({reservation['tour_date']} - {reservation['tour_time']} hs)"

    payload = {
        "items": [
            {
                "id": str(excursion["id"]),
                "title": item_title[:120],
                "description": item_desc[:250],
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(reservation["total_price"])
            }
        ],
        "payer": {
            "name": first_name,
            "surname": last_name,
            "email": reservation["customer_email"],
            "phone": {
                "number": reservation["customer_phone"].replace(" ", "").replace("+", "")
            },
            "identification": {
                "type": "DNI",
                "number": reservation.get("customer_dni", "0") or "0"
            }
        },
        "back_urls": {
            "success": success_url,
            "pending": pending_url,
            "failure": failure_url
        },
        "auto_return": "approved",
        "external_reference": reservation["code"],
        "statement_descriptor": "MERLO AVENTURA",
        "notification_url": webhook_url
    }

    try:
        response = requests.post(
            f"{MP_API_BASE}/checkout/preferences",
            headers=headers,
            json=payload,
            timeout=12
        )
        data = response.json()

        if response.status_code in (200, 201):
            sandbox_mode = get_setting("mp_sandbox", "true").lower() in ("true", "1", "yes")
            # If sandbox mode is checked or token is TEST, use sandbox_init_point if available
            checkout_url = data.get("sandbox_init_point") if (sandbox_mode and "sandbox_init_point" in data) else data.get("init_point")

            return {
                "success": True,
                "mode": "api",
                "preference_id": data.get("id"),
                "init_point": checkout_url or data.get("init_point"),
                "raw": data
            }
        else:
            logger.error(f"Error creating MP preference: {data}")
            return {
                "success": False,
                "error": data.get("message", "Error al comunicarse con Mercado Pago"),
                "raw": data
            }
    except Exception as e:
        logger.exception("Exception in MP preference creation")
        return {
            "success": False,
            "error": str(e)
        }

def get_payment_info(payment_id):
    """
    Fetches payment details from Mercado Pago API using payment_id.
    """
    access_token = get_setting("mp_access_token", "").strip()
    if not access_token:
        return None

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        response = requests.get(f"{MP_API_BASE}/v1/payments/{payment_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch payment info: {e}")
    return None
