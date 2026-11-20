import os
import random
import string
import json
import logging
from datetime import datetime, date
from werkzeug.utils import secure_filename
from flask import (
    Flask, render_template, request, jsonify, redirect,
    url_for, session, flash, send_from_directory, abort
)
from database import (
    get_db, init_db, get_setting, set_setting, get_all_settings
)
from mercadopago_service import create_mp_preference, get_payment_info

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("merlo_aventura")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "merlo-aventura-secret-key-2026-comechingones")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "receipts")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database schema and seeds
init_db()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_booking_code():
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=5))
    return f"MA-{suffix}"

# Context processor for global template variables
@app.context_processor
def inject_global_data():
    settings = get_all_settings()
    return {
        "settings": settings,
        "current_year": datetime.now().year,
        "site_name": "Merlo Aventura",
        "site_slogan": "Excursiones 4x4 en las Sierras de Merlo, San Luis"
    }

# ----------------- FRONTEND ROUTES ----------------- #

@app.route("/")
def index():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM excursions WHERE is_active = 1 ORDER BY id ASC")
    excursions_raw = cursor.fetchall()
    
    # Parse JSON fields
    excursions = []
    for row in excursions_raw:
        item = dict(row)
        try:
            item["includes_list"] = json.loads(item["includes"])
        except Exception:
            item["includes_list"] = []
        try:
            item["times_list"] = json.loads(item["departure_times"])
        except Exception:
            item["times_list"] = ["09:00"]
        excursions.append(item)
    
    conn.close()

    # Check if user video exists
    video_path = os.path.join(BASE_DIR, "static", "videos", "hero.mp4")
    has_video = os.path.exists(video_path)

    return render_template("index.html", excursions=excursions, has_video=has_video)

@app.route("/excursiones/<slug>")
def excursion_detail(slug):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM excursions WHERE slug = ? AND is_active = 1", (slug,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        abort(404)
        
    excursion = dict(row)
    try:
        excursion["includes_list"] = json.loads(excursion["includes"])
    except Exception:
        excursion["includes_list"] = []
    try:
        excursion["times_list"] = json.loads(excursion["departure_times"])
    except Exception:
        excursion["times_list"] = ["09:00"]

    # Other excursions for recommendations
    cursor.execute("SELECT * FROM excursions WHERE id != ? AND is_active = 1 LIMIT 3", (excursion["id"],))
    other_rows = cursor.fetchall()
    others = [dict(r) for r in other_rows]
    conn.close()

    return render_template("excursion_detail.html", excursion=excursion, others=others)

# ----------------- BOOKING & CALENDAR API ----------------- #

@app.route("/api/excursions")
def api_excursions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, slug, price_adult, price_child, departure_times, max_passengers_per_slot, duration FROM excursions WHERE is_active = 1")
    rows = cursor.fetchall()
    data = []
    for r in rows:
        item = dict(r)
        item["times"] = json.loads(item["departure_times"]) if item["departure_times"] else ["09:00"]
        data.append(item)
    conn.close()
    return jsonify({"success": True, "excursions": data})

@app.route("/api/availability")
def api_availability():
    """
    Checks booked seats for a given excursion and date.
    Returns available spots per time slot.
    """
    excursion_id = request.args.get("excursion_id", type=int)
    date_str = request.args.get("date", "").strip()

    if not excursion_id or not date_str:
        return jsonify({"success": False, "error": "Faltan parámetros excursion_id y date"}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Get excursion max slot capacity
    cursor.execute("SELECT max_passengers_per_slot, departure_times FROM excursions WHERE id = ?", (excursion_id,))
    exc = cursor.fetchone()
    if not exc:
        conn.close()
        return jsonify({"success": False, "error": "Excursión no encontrada"}), 404

    max_capacity = exc["max_passengers_per_slot"]
    try:
        times = json.loads(exc["departure_times"])
    except Exception:
        times = ["09:00"]

    # Query existing confirmed or pending reservations
    cursor.execute("""
        SELECT tour_time, SUM(total_passengers) as booked_seats
        FROM reservations
        WHERE excursion_id = ? AND tour_date = ? AND payment_status != 'cancelled'
        GROUP BY tour_time
    """, (excursion_id, date_str))

    booked_map = {row["tour_time"]: row["booked_seats"] for row in cursor.fetchall()}
    conn.close()

    availability = []
    for t in times:
        booked = booked_map.get(t, 0)
        remaining = max(0, max_capacity - booked)
        availability.append({
            "time": t,
            "max_capacity": max_capacity,
            "booked": booked,
            "remaining": remaining,
            "is_available": remaining > 0
        })

    return jsonify({
        "success": True,
        "date": date_str,
        "excursion_id": excursion_id,
        "slots": availability
    })

@app.route("/api/bookings", methods=["POST"])
def api_create_booking():
    """
    Creates a new reservation and initiates the chosen payment method (Mercado Pago or Transferencia).
    """
    data = request.get_json() or {}

    excursion_id = data.get("excursion_id")
    tour_date = data.get("tour_date", "").strip()
    tour_time = data.get("tour_time", "").strip()
    adults = int(data.get("adults", 1))
    children = int(data.get("children", 0))
    customer_name = data.get("customer_name", "").strip()
    customer_email = data.get("customer_email", "").strip()
    customer_phone = data.get("customer_phone", "").strip()
    customer_dni = data.get("customer_dni", "").strip()
    hotel_address = data.get("hotel_address", "").strip()
    notes = data.get("notes", "").strip()
    payment_method = data.get("payment_method", "mercadopago").lower()

    if not all([excursion_id, tour_date, tour_time, customer_name, customer_email, customer_phone]):
        return jsonify({"success": False, "error": "Por favor completá todos los campos obligatorios."}), 400

    total_passengers = adults + children
    if total_passengers < 1:
        return jsonify({"success": False, "error": "Debe haber al menos 1 pasajero."}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Get excursion info
    cursor.execute("SELECT * FROM excursions WHERE id = ? AND is_active = 1", (excursion_id,))
    excursion_row = cursor.fetchone()
    if not excursion_row:
        conn.close()
        return jsonify({"success": False, "error": "La excursión seleccionada no está disponible."}), 404

    excursion = dict(excursion_row)

    # Check capacity
    cursor.execute("""
        SELECT SUM(total_passengers) as booked_seats
        FROM reservations
        WHERE excursion_id = ? AND tour_date = ? AND tour_time = ? AND payment_status != 'cancelled'
    """, (excursion_id, tour_date, tour_time))
    booked = cursor.fetchone()["booked_seats"] or 0
    max_cap = excursion["max_passengers_per_slot"]

    if booked + total_passengers > max_cap:
        conn.close()
        return jsonify({
            "success": False,
            "error": f"Lo sentimos, solo quedan {max(0, max_cap - booked)} lugares disponibles para ese turno."
        }), 400

    # Calculate total price
    total_price = (adults * excursion["price_adult"]) + (children * excursion["price_child"])
    code = generate_booking_code()

    # Insert reservation
    cursor.execute("""
    INSERT INTO reservations (
        code, excursion_id, tour_date, tour_time, adults, children,
        total_passengers, total_price, customer_name, customer_email,
        customer_phone, customer_dni, hotel_address, notes,
        payment_method, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        code, excursion_id, tour_date, tour_time, adults, children,
        total_passengers, total_price, customer_name, customer_email,
        customer_phone, customer_dni, hotel_address, notes,
        payment_method, "pending"
    ))
    reservation_id = cursor.lastrowid
    conn.commit()

    # Fetch created reservation
    cursor.execute("SELECT * FROM reservations WHERE id = ?", (reservation_id,))
    reservation = dict(cursor.fetchone())
    conn.close()

    host_url = request.host_url.rstrip("/")

    # Handle payment method
    if payment_method == "mercadopago":
        mp_res = create_mp_preference(reservation, excursion, host_url)
        if mp_res["success"]:
            # Update preference id in db
            conn = get_db()
            c = conn.cursor()
            c.execute("UPDATE reservations SET mp_preference_id = ? WHERE id = ?", (mp_res.get("preference_id"), reservation_id))
            conn.commit()
            conn.close()

            return jsonify({
                "success": True,
                "code": code,
                "payment_method": "mercadopago",
                "init_point": mp_res["init_point"],
                "preference_id": mp_res.get("preference_id"),
                "mode": mp_res.get("mode")
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Error al generar pago en Mercado Pago: {mp_res.get('error')}"
            }), 500

    else:
        # Bank Transfer
        return jsonify({
            "success": True,
            "code": code,
            "payment_method": "transferencia",
            "redirect_url": f"/reserva/transferencia?code={code}"
        })

# ----------------- PAYMENT & CONFIRMATION PAGES ----------------- #

@app.route("/reserva/transferencia")
def transfer_instructions():
    code = request.args.get("code", "").strip()
    if not code:
        return redirect(url_for("index"))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, e.name as excursion_name, e.duration as excursion_duration
        FROM reservations r
        JOIN excursions e ON r.excursion_id = e.id
        WHERE r.code = ?
    """, (code,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        flash("Reserva no encontrada", "danger")
        return redirect(url_for("index"))

    booking = dict(row)
    settings = get_all_settings()

    # Prepare pre-formatted WhatsApp message
    msg = (
        f"¡Hola Merlo Aventura! Acabo de hacer la reserva #{booking['code']} "
        f"para la excursión '{booking['excursion_name']}' el {booking['tour_date']} a las {booking['tour_time']} hs "
        f"({booking['total_passengers']} personas). Total: ${booking['total_price']:,.2f}. "
        f"Adjunto mi comprobante de transferencia."
    )
    from urllib.parse import quote
    whatsapp_url = f"https://wa.me/{settings.get('whatsapp_raw', '5492664123456')}?text={quote(msg)}"

    return render_template(
        "booking_transfer.html",
        booking=booking,
        settings=settings,
        whatsapp_url=whatsapp_url
    )

@app.route("/api/bookings/<code_or_id>/upload-receipt", methods=["POST"])
def upload_receipt(code_or_id):
    if "receipt" not in request.files:
        return jsonify({"success": False, "error": "No se envió ningún archivo"}), 400

    file = request.files["receipt"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Archivo no seleccionado"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"comprobante_{code_or_id}_{int(datetime.now().timestamp())}.{ext}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        rel_path = f"uploads/receipts/{filename}"

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE reservations
            SET transfer_receipt = ?, updated_at = CURRENT_TIMESTAMP
            WHERE code = ? OR id = ?
        """, (rel_path, code_or_id, code_or_id))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "¡Comprobante subido correctamente! Nuestro equipo lo verificará a la brevedad.",
            "file_url": url_for("static", filename=rel_path)
        })

    return jsonify({"success": False, "error": "Formato de archivo no permitido. Usá JPG, PNG o PDF."}), 400

@app.route("/reserva/confirmacion")
def booking_confirmation():
    """
    Displays the confirmation voucher / receipt page after payment or booking.
    Accepts Mercado Pago return params (status, payment_id, external_reference, etc.)
    """
    code = request.args.get("code") or request.args.get("external_reference")
    mp_status = request.args.get("status") or request.args.get("collection_status")
    payment_id = request.args.get("payment_id") or request.args.get("collection_id")

    if not code:
        return redirect(url_for("index"))

    conn = get_db()
    cursor = conn.cursor()

    # If returned from Mercado Pago with status
    if mp_status:
        new_status = "approved" if mp_status == "approved" else ("pending" if mp_status in ("pending", "in_process") else "rejected")
        cursor.execute("""
            UPDATE reservations
            SET mp_payment_id = COALESCE(?, mp_payment_id),
                mp_status = ?,
                payment_status = CASE WHEN payment_status = 'approved' THEN 'approved' ELSE ? END,
                updated_at = CURRENT_TIMESTAMP
            WHERE code = ?
        """, (payment_id, mp_status, new_status, code))
        conn.commit()

    cursor.execute("""
        SELECT r.*, e.name as excursion_name, e.duration as excursion_duration,
               e.pickup as excursion_pickup, e.vehicle as excursion_vehicle
        FROM reservations r
        JOIN excursions e ON r.excursion_id = e.id
        WHERE r.code = ?
    """, (code,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        flash("Reserva no encontrada", "danger")
        return redirect(url_for("index"))

    booking = dict(row)
    return render_template("booking_confirmation.html", booking=booking)

@app.route("/checkout/simulado")
def simulated_checkout():
    """
    Interactive test checkout for demonstration and testing before adding live Mercado Pago token.
    """
    code = request.args.get("code", "")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, e.name as excursion_name
        FROM reservations r
        JOIN excursions e ON r.excursion_id = e.id
        WHERE r.code = ?
    """, (code,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return "Reserva no encontrada", 404

    booking = dict(row)
    return render_template("simulated_checkout.html", booking=booking)

# ----------------- MERCADO PAGO WEBHOOK ----------------- #

@app.route("/api/mercadopago/webhook", methods=["POST"])
def mp_webhook():
    """
    Official webhook handler for Mercado Pago payment notifications.
    """
    topic = request.args.get("topic") or request.args.get("type")
    payment_id = request.args.get("id") or request.args.get("data.id")

    if not payment_id and request.is_json:
        body = request.get_json(silent=True) or {}
        if body.get("type") == "payment" and "data" in body:
            payment_id = body["data"].get("id")

    if payment_id:
        payment_info = get_payment_info(payment_id)
        if payment_info:
            external_reference = payment_info.get("external_reference")
            status = payment_info.get("status")

            if external_reference:
                conn = get_db()
                cursor = conn.cursor()
                new_status = "approved" if status == "approved" else ("rejected" if status in ("rejected", "cancelled") else "pending")
                cursor.execute("""
                    UPDATE reservations
                    SET mp_payment_id = ?,
                        mp_status = ?,
                        payment_status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE code = ?
                """, (payment_id, status, new_status, external_reference))
                conn.commit()
                conn.close()
                logger.info(f"Webhook updated reservation {external_reference} status to {status}")

    return jsonify({"status": "received"}), 200

# ----------------- ADMIN DASHBOARD ----------------- #

def admin_logged_in():
    return session.get("admin_logged") is True

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if admin_logged_in():
        return redirect(url_for("admin_dashboard"))

    if request.method == "POST":
        password = request.form.get("password", "")
        correct_pwd = get_setting("admin_password", "admin")
        if password == correct_pwd:
            session["admin_logged"] = True
            flash("Bienvenido al panel de administración", "success")
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Contraseña incorrecta", "danger")

    return render_template("admin/login.html")

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged", None)
    flash("Sesión cerrada", "info")
    return redirect(url_for("admin_login"))

@app.route("/admin")
@app.route("/admin/dashboard")
def admin_dashboard():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    status_filter = request.args.get("status", "all")
    date_filter = request.args.get("date", "")
    search_query = request.args.get("q", "").strip()

    conn = get_db()
    cursor = conn.cursor()

    # Query statistics
    cursor.execute("SELECT COUNT(*) as total FROM reservations")
    total_bookings = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as approved FROM reservations WHERE payment_status = 'approved'")
    approved_bookings = cursor.fetchone()["approved"]

    cursor.execute("SELECT COUNT(*) as pending FROM reservations WHERE payment_status = 'pending'")
    pending_bookings = cursor.fetchone()["pending"]

    cursor.execute("SELECT SUM(total_price) as revenue FROM reservations WHERE payment_status = 'approved'")
    total_revenue = cursor.fetchone()["revenue"] or 0

    # Build dynamic query for reservations
    query = """
        SELECT r.*, e.name as excursion_name
        FROM reservations r
        JOIN excursions e ON r.excursion_id = e.id
        WHERE 1=1
    """
    params = []

    if status_filter != "all":
        query += " AND r.payment_status = ?"
        params.append(status_filter)

    if date_filter:
        query += " AND r.tour_date = ?"
        params.append(date_filter)

    if search_query:
        query += " AND (r.code LIKE ? OR r.customer_name LIKE ? OR r.customer_phone LIKE ? OR r.customer_email LIKE ?)"
        like_term = f"%{search_query}%"
        params.extend([like_term, like_term, like_term, like_term])

    query += " ORDER BY r.created_at DESC"

    cursor.execute(query, params)
    reservations = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM excursions ORDER BY id ASC")
    excursions = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return render_template(
        "admin/dashboard.html",
        total_bookings=total_bookings,
        approved_bookings=approved_bookings,
        pending_bookings=pending_bookings,
        total_revenue=total_revenue,
        reservations=reservations,
        excursions=excursions,
        current_status=status_filter,
        current_date=date_filter,
        current_q=search_query
    )

@app.route("/admin/reservations/<int:res_id>/status", methods=["POST"])
def admin_update_reservation_status(res_id):
    if not admin_logged_in():
        return jsonify({"success": False, "error": "No autorizado"}), 401

    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ("approved", "pending", "rejected", "cancelled"):
        return jsonify({"success": False, "error": "Estado inválido"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE reservations
        SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, res_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "status": new_status})

@app.route("/admin/settings", methods=["GET", "POST"])
def admin_settings():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    if request.method == "POST":
        fields = [
            "mp_access_token", "mp_public_key", "mp_sandbox",
            "bank_name", "bank_account_holder", "bank_cuit",
            "bank_alias", "bank_cbu", "bank_cvu",
            "whatsapp_number", "whatsapp_raw", "contact_email",
            "address", "admin_password"
        ]
        for field in fields:
            val = request.form.get(field, "").strip()
            set_setting(field, val)

        flash("¡Configuración guardada exitosamente!", "success")
        return redirect(url_for("admin_settings"))

    settings = get_all_settings()
    return render_template("admin/settings.html", settings=settings)

@app.route("/admin/manifest")
def admin_passenger_manifest():
    """
    Printable / downloadable passenger list for a specific tour and date.
    """
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    excursion_id = request.args.get("excursion_id", type=int)
    tour_date = request.args.get("date", "").strip()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM excursions WHERE id = ?", (excursion_id,))
    excursion = cursor.fetchone()

    cursor.execute("""
        SELECT * FROM reservations
        WHERE excursion_id = ? AND tour_date = ? AND payment_status != 'cancelled'
        ORDER BY tour_time ASC, id ASC
    """, (excursion_id, tour_date))
    reservations = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return render_template(
        "admin/manifest.html",
        excursion=dict(excursion) if excursion else None,
        tour_date=tour_date,
        reservations=reservations
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)
