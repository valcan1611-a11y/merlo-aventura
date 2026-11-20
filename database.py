import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "merlo_aventura.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Table: excursions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS excursions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        duration TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        price_adult REAL NOT NULL,
        price_child REAL NOT NULL,
        badge TEXT,
        image_url TEXT NOT NULL,
        vehicle TEXT NOT NULL,
        pickup TEXT NOT NULL,
        includes TEXT NOT NULL,
        departure_times TEXT NOT NULL,
        max_passengers_per_slot INTEGER NOT NULL DEFAULT 8,
        is_active INTEGER NOT NULL DEFAULT 1
    );
    """)

    # Table: reservations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        excursion_id INTEGER NOT NULL,
        tour_date TEXT NOT NULL,
        tour_time TEXT NOT NULL,
        adults INTEGER NOT NULL DEFAULT 1,
        children INTEGER NOT NULL DEFAULT 0,
        total_passengers INTEGER NOT NULL,
        total_price REAL NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_dni TEXT,
        hotel_address TEXT,
        notes TEXT,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        mp_preference_id TEXT,
        mp_payment_id TEXT,
        mp_status TEXT,
        transfer_receipt TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (excursion_id) REFERENCES excursions (id)
    );
    """)

    # Table: settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    # Table: availability overrides (for blocking dates or setting custom limits)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS availability_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        excursion_id INTEGER,
        block_date TEXT NOT NULL,
        reason TEXT,
        FOREIGN KEY (excursion_id) REFERENCES excursions (id)
    );
    """)

    conn.commit()

    # Seed initial settings if not present
    default_settings = {
        "mp_access_token": "",
        "mp_public_key": "",
        "mp_sandbox": "true",
        "bank_name": "Banco Galicia / Mercado Pago",
        "bank_account_holder": "Merlo Aventura SRL",
        "bank_cuit": "30-71829384-9",
        "bank_alias": "MERLO.AVENTURA.4X4",
        "bank_cbu": "0070123430004059683921",
        "bank_cvu": "0000003100098472819401",
        "whatsapp_number": "+54 9 2664 12-3456",
        "whatsapp_raw": "5492664123456",
        "contact_email": "reservas@merloaventura.com.ar",
        "address": "Av. del Sol 650, Villa de Merlo, San Luis",
        "admin_password": "admin"
    }

    for key, val in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, val))

    # Seed default excursions if empty
    cursor.execute("SELECT COUNT(*) as count FROM excursions")
    count = cursor.fetchone()["count"]
    if count == 0:
        seed_excursions(cursor)

    conn.commit()
    conn.close()

def seed_excursions(cursor):
    excursions_data = [
        (
            "Pueblo Escondido y Salto del Tigre",
            "pueblo-escondido-salto-del-tigre",
            "Travesía completa por la Quebrada de Guanaquito hasta el mítico pueblo minero y la gran cascada Salto del Tigre (+7 años).",
            "Una expedición de día completo en camionetas 4x4 especialmente preparadas. Descendemos por huellas rocosas y vados cristalinos hasta llegar a Pueblo Escondido, el mítico pueblo minero en el fondo del cañón, y realizamos la caminata guiada hacia la imponente cascada Salto del Tigre con su pileta natural de aguas esmeralda. Incluye almuerzo criollo, visita a las galerías subterráneas y tiempo libre.",
            "Día Completo (8 a 9 hs)",
            "Aventura / Nivel Medio",
            90000.0,
            68000.0,
            "Más Completa",
            "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80",
            "Camioneta 4x4 equipada de montaña",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Traslados 4x4 de alta montaña ida y vuelta",
                "Visita guiada a Pueblo Escondido y túneles",
                "Trekking y acceso al Salto del Tigre",
                "Guía baqueano y habilitado provincial",
                "Almuerzo criollo campestre",
                "Seguro integral de turismo aventura"
            ]),
            json.dumps(["08:30"]),
            8,
            1
        ),
        (
            "Pueblo Escondido",
            "pueblo-escondido",
            "Expedición al legendario pueblo minero en el fondo del cañón de los Comechingones, historia y huellas de roca (+7 años).",
            "Recorrido off-road en 4x4 hacia las profundidades de la Quebrada de Guanaquito. Conocé la historia de la mina de tungsteno, las construcciones de piedra abandonadas en el tiempo, la usina hidroeléctrica y los puentes colgantes. Incluye tiempo para recorrer los senderos y disfrutar de la gastronomía serrana.",
            "Día Completo (8 hs)",
            "Aventura / Nivel Medio",
            75000.0,
            56000.0,
            "Clásico Imperdible",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
            "Toyota Hilux 4x4 preparada",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Traslado 4x4 por huella de montaña",
                "Recorrido histórico por galerías subterráneas",
                "Almuerzo criollo campestre",
                "Guía profesional permanente",
                "Seguro de turismo aventura"
            ]),
            json.dumps(["09:00"]),
            8,
            1
        ),
        (
            "Salto del Tigre",
            "salto-del-tigre",
            "Una imponente cascada escondida en las altas cumbres con una profunda pileta natural de agua esmeralda cristalina.",
            "Subimos en camioneta 4x4 hasta las altas cumbres de los Comechingones para emprender una caminata entre quebradas y pastizales de altura hasta llegar al Salto del Tigre, una de las caídas de agua más hermosas y vírgenes de las sierras con su hoya natural ideal para refrescarse.",
            "Medio Día (5 a 6 hs)",
            "Moderada / Trekking",
            60000.0,
            45000.0,
            "Cascada Imponente",
            "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
            "Camioneta 4x4 con tracción total",
            "Pick up coordinado en Merlo y alrededores",
            json.dumps([
                "Traslados 4x4 hasta el inicio del sendero",
                "Caminata guiada hacia la cascada",
                "Tiempo para bañarse en la hoya natural",
                "Refrigerio serrano y mate",
                "Seguro de pasajero transportado"
            ]),
            json.dumps(["09:00", "14:30"]),
            8,
            1
        ),
        (
            "Salto del Tabaquillo",
            "salto-del-tabaquillo",
            "Travesía y caminata entre bosques de tabaquillos y pozas de agua pura hasta la majestuosa cascada de 18 metros (+7 años).",
            "Ingresamos por huellas de montaña exclusivas hasta las nacientes de los arroyos serranos. Una combinación inolvidable de tramos off-road en camioneta y una caminata guiada siguiendo el curso del arroyo hasta la imponente cascada de 18 metros del Salto del Tabaquillo. Tiempo para refrescarse en las ollas naturales de roca.",
            "Medio Día (5 a 6 hs)",
            "Moderada / Naturaleza",
            45000.0,
            34000.0,
            "Naturaleza Pura",
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
            "4x4 tracción total con acceso exclusivo",
            "Pick up en hoteles céntricos y zona alta de Merlo",
            json.dumps([
                "Traslado 4x4 hasta las nacientes de la quebrada",
                "Trekking guiado por el lecho del arroyo",
                "Cascada de 18 metros y ollas de piedra",
                "Snack energético serrano",
                "Seguro de accidentes personales"
            ]),
            json.dumps(["09:00", "14:30"]),
            8,
            1
        ),
        (
            "Cascada Hoya de Piedra - Quebrada El Molino",
            "cascada-hoya-de-piedra-quebrada-el-molino",
            "Descubrí uno de los rincones más mágicos y secretos de Merlo, con piletones naturales de cuarzo y arroyos serranos.",
            "Paseo relajante y visualmente impactante hacia la Quebrada El Molino. Senderos rodeados de vegetación autóctona que conducen a la Cascada Hoya de Piedra, una piscina de roca natural pulida por el agua donde se forman ollas profundas de agua transparente.",
            "Medio Día (3 a 4 hs)",
            "Familiar / Baja",
            30000.0,
            22000.0,
            "Rincón Secreto",
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
            "Vehículo 4x4 climatizado",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Traslado ida y vuelta desde tu hotel",
                "Caminata suave apta para toda la familia",
                "Paradas en pozas naturales para refrescarse",
                "Guía baqueano con relatos históricos del molino",
                "Seguro integral incluido"
            ]),
            json.dumps(["09:30", "15:00"]),
            8,
            1
        ),
        (
            "Excursión Salto del Tigre + Atardecer",
            "salto-del-tigre-atardecer",
            "Destino Salto del Tigre combinado con la inolvidable magia de contemplar la puesta de sol dorada sobre las sierras.",
            "Una salida vespertina especial: visitamos la cascada Salto del Tigre durante las horas más tranquilas de la tarde y luego nos posicionamos en miradores de altura exclusivos para apreciar la puesta del sol cayendo sobre el Valle del Conlara.",
            "Tarde / Atardecer (5 a 6 hs)",
            "Moderada",
            65000.0,
            49000.0,
            "Atardecer Mágico",
            "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80",
            "Camioneta 4x4 con luces auxiliares",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Visita completa a la cascada Salto del Tigre",
                "Punto panorámico exclusivo para el atardecer",
                "Brindis serrano con degustación de dulces y quesos",
                "Guía especializado en fotografía de montaña",
                "Regreso nocturno seguro en 4x4"
            ]),
            json.dumps(["14:30"]),
            8,
            1
        ),
        (
            "Trekking Nocturno - Aventura bajo las estrellas",
            "trekking-nocturno-bajo-las-estrellas",
            "Viví una experiencia diferente bajo el cielo más limpio de San Luis, con telescopio, constelaciones y vistas nocturnas del valle.",
            "Merlo posee uno de los cielos más limpios y con menor contaminación lumínica del país. Subimos en camionetas 4x4 al anochecer. Luego, realizamos un trekking suave guiados por estrellas y leyendas comechingonas, observamos constelaciones con telescopio y brindamos con chocolate artesanal caliente.",
            "Nocturna (3 a 4 hs)",
            "Para todas las edades",
            60000.0,
            45000.0,
            "Aventura Estelar",
            "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
            "Camionetas 4x4 equipadas",
            "Punto de encuentro o pick up en hotel",
            json.dumps([
                "Ascenso nocturno en 4x4 a miradores de altura",
                "Caminata bajo la luna y las estrellas con linternas",
                "Reconocimiento de constelaciones con láser astronómico",
                "Chocolate caliente artesanal y mantas térmicas",
                "Seguro de turismo aventura"
            ]),
            json.dumps(["19:30"]),
            8,
            1
        ),
        (
            "Los Vallecitos (Parque Natural)",
            "los-vallecitos-parque-natural",
            "Parque Natural de más de 10.000 hectáreas en las cumbres de los Comechingones, avistaje de fauna autóctona, cóndores y paisajes vírgenes.",
            "Travesía de expedición a la reserva de alta montaña Los Vallecitos. Un territorio agreste y protegido con pastizales de altura, quebradas profundas, arroyos de deshielo y refugio de manadas de fauna autóctona y cóndores andinos.",
            "Día Completo (7 a 8 hs)",
            "Aventura Natural",
            95000.0,
            72000.0,
            "Parque Natural",
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
            "Toyota Hilux 4x4 alta montaña",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Ingreso y pase al Parque Natural Los Vallecitos",
                "Travesía 4x4 por senderos vírgenes protegidos",
                "Avistaje de cóndores andinos y aves serranas",
                "Almuerzo de campo en las alturas",
                "Guía naturalista habilitado"
            ]),
            json.dumps(["08:30"]),
            8,
            1
        ),
        (
            "Cerro de Las Ovejas 2280msnm o Cabeza del Indio",
            "cerro-de-las-ovejas-cabeza-del-indio",
            "Ascenso a la cumbre más alta de la provincia de San Luis (2.280 msnm), cumbre emblemática con panorámicas épicas de 360°.",
            "La travesía cumbre de Merlo: alcanzamos el punto más elevado de la provincia de San Luis a 2.280 metros de altura sobre el nivel del mar y la emblemática geoforma pétrea de la Cabeza del Indio. Vistas infinitas a los valles de San Luis y Córdoba.",
            "Día Completo (8 a 9 hs)",
            "Alta Montaña / Exigente",
            130000.0,
            98000.0,
            "Cumbre Más Alta (2.280m)",
            "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
            "Flota 4x4 de alta cumbre con VHF",
            "Pick up en tu cabaña u hotel en Merlo",
            json.dumps([
                "Travesía 4x4 de ascenso al techo de San Luis",
                "Trekking a la cumbre del Cerro de las Ovejas (2.280m)",
                "Visita a la formación Cabeza del Indio",
                "Almuerzo de expedición y bebidas isotónicas",
                "Bastones de trekking y botiquín de altura",
                "Seguro integral de turismo aventura"
            ]),
            json.dumps(["08:00"]),
            8,
            1
        ),
        (
            "Experiencia La Huertita (Fin de Semana Exclusivo)",
            "experiencia-la-huertita",
            "Fin de semana exclusivo de naturaleza, agua y serranías: trekking al Cerro La Bandera, kayak, cicloturismo e interpretación arqueológica en Cueva del Indio y La Olla.",
            "Un fin de semana exclusivo de naturaleza, agua y serranías en el Dique La Huertita, San Luis. Incluye 2 noches de alojamiento en la Casa del Club de Pescadores frente al agua, pensión completa, trekking al Cerro La Bandera, bautismo y travesía en kayaks, travesía en mountain bike (7 km) y visita al alero y morteros Comechingones en Cueva del Indio y pozos de agua en La Olla.",
            "3 Días / 2 Noches",
            "Multiaventura (Trekking, Kayak, Bici)",
            195000.0,
            145000.0,
            "Fin de Semana Todo Incluido",
            "images/excursions/huertita/huertita_portada.png",
            "2 Camionetas de expedición desde Merlo (~100 km)",
            "Pick up coordinado en Merlo o punto de encuentro",
            json.dumps([
                "Traslados ida y vuelta desde Merlo en 2 camionetas",
                "2 Noches de alojamiento exclusivo en Club de Pescadores (16 plazas)",
                "Pensión completa (2 desayunos serranos, 2 cenas completas y viandas)",
                "Trekking guiado al Cerro La Bandera con flora autóctona",
                "Bautismo y travesía guiada en kayaks con chalecos DAF",
                "Travesía en bicicletas mountain bike (7 km)",
                "Visita arqueológica guiada a Cueva del Indio (alero y mortero Comechingón)",
                "2 Guías profesionales habilitados de turismo activo y montaña",
                "Seguros integrales y botiquín de primeros auxilios"
            ]),
            json.dumps(["15:00"]),
            16,
            1
        )
    ]

    cursor.executemany("""
    INSERT INTO excursions (
        name, slug, subtitle, description, duration, difficulty,
        price_adult, price_child, badge, image_url, vehicle, pickup,
        includes, departure_times, max_passengers_per_slot, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, excursions_data)

def get_setting(key, default=""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def set_setting(key, value):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """, (key, str(value)))
    conn.commit()
    conn.close()

def get_all_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}
