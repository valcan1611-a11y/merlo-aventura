/**
 * Catálogo centralizado de excursiones de Merlo Aventura.
 * Fuente única para cards, filtros, modal de detalle, mapa Leaflet,
 * formulario de reserva, consulta rápida y footer.
 */

export const CATALOG_FILTERS = {
    categories: [
        { id: 'all', label: 'Todas las salidas', icon: 'fa-solid fa-compass' },
        { id: 'pueblo-minero', label: 'Pueblo Escondido', icon: 'fa-solid fa-landmark' },
        { id: 'cascadas', label: 'Cascadas & Arroyos', icon: 'fa-solid fa-water' },
        { id: 'atardecer-nocturna', label: 'Atardecer & Nocturna', icon: 'fa-solid fa-moon' },
        { id: 'cumbres', label: 'Alta Cumbre', icon: 'fa-solid fa-mountain' },
        { id: 'multiaventura', label: 'Fin de Semana', icon: 'fa-solid fa-campground' }
    ],
    difficulties: [
        { id: 'all', label: 'Cualquier dificultad' },
        { id: 'facil', label: 'Fácil / Familiar' },
        { id: 'media', label: 'Moderada' },
        { id: 'exigente', label: 'Exigente / Cumbre' }
    ],
    durations: [
        { id: 'all', label: 'Cualquier duración' },
        { id: 'medio-dia', label: 'Medio Día (3–6 hs)' },
        { id: 'dia-completo', label: 'Día Completo (7–12 hs)' },
        { id: 'fin-de-semana', label: 'Fin de Semana (3 días)' }
    ]
};

export const EXCURSIONS = [
    {
        id: 1,
        slug: 'pueblo-escondido-salto-del-tigre',
        name: 'Pueblo Escondido y Salto del Tigre',
        shortName: 'Pueblo Escondido + Salto del Tigre',
        subtitle:
            'Travesía de día completo hasta el mítico pueblo minero abandonado y la cascada Salto del Tigre con hoya esmeralda.',
        category: 'pueblo-minero',
        categoryLabel: 'Pueblo Minero & Cascada',
        duration: 'Día Completo (8 a 9 hs)',
        durationRange: 'dia-completo',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 90000,
        priceChild: 68000,
        badge: 'Más Elegida',
        ageLimit: '+7 años',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['08:30'],
        trailKey: 'pueblo-escondido-cerro-aspero',
        wikilocUrl: 'https://www.wikiloc.com/hiking-trails/pueblo-escondido-y-cumbre-del-cerro-aspero-80317263',
        routeInfo: {
            routeData: 'static/routes/cerro-aspero.json',
            time4x4: '1 h · 21,5 km',
            short4x4: '1 h (21,5 km)',
            desc4x4: 'Aproximación en Nissan Frontier 4x4 desde Plaza central de Merlo por el Filo Comechingones hasta el inicio de senda.',
            timeTrek: '4h 40m · 13,7 km',
            shortTrek: '13,7 km a pie',
            descTrek: 'Circuito GPS registrado en Wikiloc: Pueblo Escondido, Cascada Salto del Tigre y entorno Cerro Áspero (2.540 puntos).',
            ratio4x4Pct: 35,
            ratioTrekPct: 65
        },
        extras: [
            {
                id: 'caballo',
                name: 'Regreso a Caballo desde Pueblo Escondido',
                price: 25000,
                perPerson: true,
                description: 'Ahorrá los 400 m de desnivel del retorno (80 min a caballo vs 120 min a pie).'
            },
            {
                id: 'bastones',
                name: 'Par de bastones de trekking',
                price: 4000,
                perPerson: true,
                description: 'Bastones telescópicos para mayor comodidad en descensos de roca.'
            }
        ],
        fullDescription: `DÍA COMPLETO · Edad recomendada: +7 años.

La experiencia definitiva de alta montaña en los Comechingones: combinamos la visita al legendario pueblo minero abandonado de Pueblo Escondido en el fondo del cañón y el trekking hacia la majestuosa cascada Salto del Tigre con su pileta natural de agua cristalina.

Aproximamos en camionetas Nissan Frontier 4x4 atravesando cuestas de altura y arroyos serranos. En Pueblo Escondido recorremos las antiguas galerías subterráneas de tungsteno, la usina hidroeléctrica y puentes colgantes. Luego emprendemos la caminata hacia la hoya natural del Salto del Tigre con tiempo libre para almorzar, tomar mate y refrescarse.`,
        includes: [
            'Guía de montaña habilitado e inscripto',
            'Seguros integrales de turismo aventura y pasajero transportado',
            'Aproximación ida y vuelta en Nissan Frontier 4x4',
            'Entradas a los campos y acceso a Pueblo Escondido',
            'Trekking guiado a la cascada Salto del Tigre'
        ],
        equipment: `Zapatillas acordonadas con buen agarre, mochila cómoda (20 L), abrigo liviano incluso en verano, gafas de sol, protector solar y gorra.
En temporada cálida llevar malla para los pozos de agua. Recomendamos agua (1,5 L) y mate/vianda.`,
        notes: 'En Pueblo Escondido hay servicio de pastas y sándwiches (si requerís menú celíaco, sugerimos llevar vianda). Regreso a caballo opcional.',
        gallery: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_montana.jpg'
        ]
    },
    {
        id: 2,
        slug: 'pueblo-escondido',
        name: 'Pueblo Escondido',
        shortName: 'Pueblo Escondido',
        subtitle:
            'Expedición al histórico pueblo minero de tungsteno en el fondo del cañón de Cerro Áspero, túneles y puentes colgantes.',
        category: 'pueblo-minero',
        categoryLabel: 'Pueblo Minero',
        duration: 'Día Completo (7 a 8 hs)',
        durationRange: 'dia-completo',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 75000,
        priceChild: 56000,
        badge: 'Clásico Imperdible',
        ageLimit: '+7 años',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['09:00'],
        trailKey: 'pueblo-escondido-cerro-aspero',
        wikilocUrl: 'https://www.wikiloc.com/hiking-trails/pueblo-escondido-y-cumbre-del-cerro-aspero-80317263',
        routeInfo: {
            routeData: 'static/routes/cerro-aspero.json',
            time4x4: '1 h · 21,5 km',
            short4x4: '1 h (21,5 km)',
            desc4x4: 'Recorrido en Nissan Frontier 4x4 desde Plaza central de Merlo hasta el estacionamiento de altura.',
            timeTrek: '3h 30m · 9,2 km',
            shortTrek: '9,2 km a pie',
            descTrek: 'Descenso por senda serrana (90 min) hasta el pueblo minero y ascenso de retorno (120 min a pie u 80 min a caballo).',
            ratio4x4Pct: 40,
            ratioTrekPct: 60
        },
        extras: [
            {
                id: 'caballo',
                name: 'Regreso a Caballo desde Pueblo Escondido',
                price: 25000,
                perPerson: true,
                description: 'Evitá los 400 m de subida a pie regresando a caballo (80 min).'
            },
            {
                id: 'bastones',
                name: 'Par de bastones de trekking',
                price: 4000,
                perPerson: true,
                description: 'Recomendados para la bajada y la subida por el cañón.'
            }
        ],
        fullDescription: `DÍA COMPLETO · Edad recomendada: +7 años · Dificultad: Moderada.

Desde Merlo tardamos aproximadamente una hora en camioneta 4x4 hasta el estacionamiento donde inicia la senda. Comenzamos un descenso guiado de 90 minutos hacia el corazón del cañón, donde emerge Pueblo Escondido, antigua mina de tungsteno de fines del siglo XIX.

Recorremos las usinas, galerías, puentes y construcciones de piedra con tiempo para almorzar. El regreso puede realizarse a pie (120 min, 400 m de desnivel positivo) o a caballo (80 min opcional).`,
        includes: [
            'Guía habilitado y baqueano de la zona',
            'Seguros de turismo aventura y traslado',
            'Entradas a los campos y acceso histórico',
            'Visita guiada a túneles, usina y construcciones',
            'Pick-up y traslado en 4x4'
        ],
        equipment: `Calzado deportivo o de trekking acordonado con buen agarre (indispensable), mochila de 20 L, abrigo en capas (en invierno gorro y guantes), protector solar, lentes y agua. Malla en verano.`,
        notes: 'En el comedor de Pueblo Escondido ofrecen pastas y sándwiches. Regreso a caballo opcional: $25.000 por persona.',
        gallery: [
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_montana.jpg'
        ]
    },
    {
        id: 3,
        slug: 'salto-del-tigre',
        name: 'Salto del Tigre',
        shortName: 'Salto del Tigre',
        subtitle:
            'Cascada de 25 metros escondida en lo más alto de las Sierras de los Comechingones con filo panorámico y hoya natural.',
        category: 'cascadas',
        categoryLabel: 'Cascadas',
        duration: 'Día Completo (9:00 a 16:00 hs)',
        durationRange: 'dia-completo',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 60000,
        priceChild: 45000,
        badge: 'Cascada 25m',
        ageLimit: '+7 años',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['09:00'],
        trailKey: 'salto-del-tigre',
        wikilocUrl: 'https://www.wikiloc.com/hiking-trails/pueblo-escondido-y-cumbre-del-cerro-aspero-80317263',
        routeInfo: {
            routeData: 'static/routes/cerro-aspero.json',
            time4x4: '1 h · 21,5 km',
            short4x4: '1 h (21,5 km)',
            desc4x4: 'Aproximación en Nissan Frontier 4x4 ascendiendo por el Filo de los Comechingones hasta el ingreso al campo.',
            timeTrek: '90 min · 7,2 km',
            shortTrek: '7,2 km a pie',
            descTrek: 'Sendero de montaña marcado hasta el balcón panorámico y la hoya natural del Salto del Tigre.',
            ratio4x4Pct: 45,
            ratioTrekPct: 55
        },
        extras: [
            {
                id: 'entrada_campo',
                name: 'Entrada al campo privado',
                price: 3500,
                perPerson: true,
                description: 'Podés sumarla ahora a tu reserva o abonarla en efectivo en la tranquera.'
            }
        ],
        fullDescription: `Una imponente cascada de 25 metros escondida en pleno corazón de las sierras.

Ubicada en lo más alto de las Sierras de los Comechingones, es uno de los paisajes preferidos para pasar el día. El recorrido combina el ascenso escénico por el Filo Serrano en 4x4 y un trekking guiado de 90 minutos ida y vuelta por senda marcada hasta el salto de agua y sus pozas cristalinas.`,
        includes: [
            'Guía de trekking habilitado',
            'Seguros de turismo aventura',
            'Recorrido panorámico por el Filo de las Sierras en 4x4',
            'Trekking guiado a la cascada y hoya natural'
        ],
        equipment: `Calzado deportivo o de trekking con buena suela, protector solar, lentes de sol, abrigo liviano, agua personal y malla en época cálida.`,
        notes: 'Entrada al campo privado: $3.500 por persona (opcional sumarla al momento de reservar).',
        gallery: [
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_aerea.jpg'
        ]
    },
    {
        id: 4,
        slug: 'salto-del-tabaquillo',
        name: 'Salto del Tabaquillo',
        shortName: 'Salto del Tabaquillo',
        subtitle:
            'Travesía por la Reserva del Rincón cruzando arroyos y bosques nativos de tabaquillos hasta una cascada de 17 metros.',
        category: 'cascadas',
        categoryLabel: 'Cascadas & Reserva',
        duration: 'Medio Día (5 a 6 hs)',
        durationRange: 'medio-dia',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 45000,
        priceChild: 34000,
        badge: 'Naturaleza Pura',
        ageLimit: '+7 años',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['09:00'],
        trailKey: null,
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.3468, -64.9780],
            destination: [-32.3550, -64.9860],
            time4x4: '15 min · 4,2 km',
            short4x4: '15 min (4,2 km)',
            desc4x4: 'Traslado puerta a puerta en Nissan Frontier 4x4 hasta el ingreso a la Reserva de Rincón del Este.',
            timeTrek: '2h 30m · 4,5 km',
            shortTrek: '4,5 km a pie',
            descTrek: 'Trekking remontando el arroyo entre bosques de tabaquillos y regreso por sendero panorámico de altura.',
            ratio4x4Pct: 20,
            ratioTrekPct: 80
        },
        extras: [
            {
                id: 'bastones',
                name: 'Par de bastones de trekking',
                price: 4000,
                perPerson: true,
                description: 'Ideales para los cruces de piedras y arroyo.'
            }
        ],
        fullDescription: `MEDIO DÍA (5 a 6 horas) · Edad recomendada: +7 años · Horario de salida: 9:00 hs.

El recorrido inicia en la Reserva del Rincón. Tras cruzar el primer arroyo nos internamos en un bosque nativo de tabaquillos sorteando piedras y pequeños saltos de agua hasta llegar al cajón rocoso donde cae el Salto del Tabaquillo, de 17 metros de altura.

Allí hacemos una pausa de 20 a 30 minutos para fotos, descanso y mate, y emprendemos el retorno por un sendero de altura con vistas abiertas al Valle del Conlara.`,
        includes: [
            'Guía inscripto en Villa de Merlo',
            'Comunicaciones VHF y botiquín de primeros auxilios',
            'Seguros integrales de turismo aventura',
            'Pick-up y regreso en 4x4'
        ],
        equipment: `Zapatillas acordonadas con buen agarre, mochila chica, abrigo liviano, gafas de sol, protector solar y gorra. En días cálidos se puede disfrutar de los pozos de agua.`,
        notes: 'Pausa especial en la cascada para fotos y mate serrano.',
        gallery: [
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_montana.jpg'
        ]
    },
    {
        id: 5,
        slug: 'cascada-hoya-de-piedra',
        name: 'Cascada Hoya de Piedra — Quebrada El Molino',
        shortName: 'Cascada Hoya de Piedra',
        subtitle:
            'Caminata pensada para disfrutar en familia entre vegetación nativa, arroyos cristalinos y merienda serrana incluida.',
        category: 'cascadas',
        categoryLabel: 'Familiar & Cascada',
        duration: 'Medio Día (3 hs aprox.)',
        durationRange: 'medio-dia',
        difficulty: 'Fácil / Familiar',
        difficultyLevel: 'facil',
        priceAdult: 30000,
        priceChild: 22000,
        badge: 'Ideal Familias',
        ageLimit: 'Toda la familia',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['09:30', '15:00'],
        trailKey: null,
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.3250, -64.9920],
            destination: [-32.3180, -64.9850],
            time4x4: '20 min · 5,5 km',
            short4x4: '20 min (5,5 km)',
            desc4x4: 'Aproximación puerta a puerta en Nissan Frontier 4x4 por camino serrano hacia Piedra Blanca.',
            timeTrek: '2 h · 3,8 km',
            shortTrek: '3,8 km a pie',
            descTrek: 'Caminata suave y panorámica por Quebrada El Molino hasta Cascada Hoya de Piedra.',
            ratio4x4Pct: 25,
            ratioTrekPct: 75
        },
        extras: [],
        fullDescription: `Descubrí uno de los rincones más lindos y accesibles de las sierras en una caminata pensada para toda la familia.

Recorremos la pintoresca Quebrada El Molino por senderos rodeados de flora nativa, arroyos de agua transparente y formaciones rocosas hasta llegar a la Cascada Hoya de Piedra. Ideal para relajarse, sacar fotos y compartir una merienda serrana incluida.`,
        includes: [
            'Merienda serrana incluida',
            'Servicio puerta a puerta (pick-up alojamiento)',
            'Guía baqueano habilitado',
            'Seguros integrales de aventura'
        ],
        equipment: `Ropa cómoda, zapatillas deportivas o de trekking, protector solar, agua y cámara o celular.`,
        notes: 'Apta para niños, adultos mayores y personas sin experiencia previa en trekking.',
        gallery: [
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_aerea.jpg'
        ]
    },
    {
        id: 6,
        slug: 'salto-del-tigre-atardecer',
        name: 'Salto del Tigre + Atardecer en el Filo',
        shortName: 'Salto del Tigre + Atardecer',
        subtitle:
            'Trekking de tarde a la cascada y pausa panorámica especial para contemplar la caída del sol sobre el Valle del Conlara.',
        category: 'atardecer-nocturna',
        categoryLabel: 'Atardecer & Cascada',
        duration: 'Tarde / Atardecer (5 a 6 hs)',
        durationRange: 'medio-dia',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 65000,
        priceChild: 49000,
        badge: 'Atardecer Mágico',
        ageLimit: 'Mín. 2 pasajeros',
        minPax: 2,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['14:30'],
        trailKey: 'salto-del-tigre',
        wikilocUrl: 'https://www.wikiloc.com/hiking-trails/pueblo-escondido-y-cumbre-del-cerro-aspero-80317263',
        routeInfo: {
            routeData: 'static/routes/cerro-aspero.json',
            time4x4: '1 h · 21,5 km',
            short4x4: '1 h (21,5 km)',
            desc4x4: 'Ascenso en Nissan Frontier 4x4 equipada con barra LED auxiliar por la cuesta del Filo Comechingones.',
            timeTrek: '90 min · 7,2 km',
            shortTrek: '7,2 km a pie',
            descTrek: 'Caminata a la cascada y mirador de altura reservado para presenciar la puesta de sol.',
            ratio4x4Pct: 45,
            ratioTrekPct: 55
        },
        extras: [],
        fullDescription: `SALIDA TODOS LOS DÍAS · Mínimo 2 pasajeros · Horario: 14:30 hs.

Trekking de dificultad media recorriendo senderos serranos, arroyos y el salto de agua con la luz dorada de la tarde. Al regresar al filo, realizamos una pausa especial en miradores naturales para disfrutar el atardecer sobre todo el valle.

Ideal para amantes de la fotografía, parejas y grupos que buscan evitar el calor del mediodía.`,
        includes: [
            'Guía habilitado',
            'Seguros de turismo aventura',
            'Entradas a los campos incluidas',
            'Pausa especial de atardecer en el Filo',
            'Traslados ida y vuelta en 4x4'
        ],
        equipment: `Calzado deportivo o de trekking con buen agarre, abrigo indispensable para la caída del sol en altura, agua y cámara.`,
        notes: 'Salidas diarias garantizadas a partir de 2 pasajeros.',
        gallery: [
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_nieve.jpg'
        ]
    },
    {
        id: 7,
        slug: 'trekking-nocturno',
        name: 'Trekking Nocturno — Aventura bajo las Estrellas',
        shortName: 'Trekking Nocturno',
        subtitle:
            'Caminata guiada con linternas frontales bajo la luz de la luna, cielo estrellado serrano y picada grupal al finalizar.',
        category: 'atardecer-nocturna',
        categoryLabel: 'Nocturna & Estrellas',
        duration: 'Nocturna (3 a 4 hs)',
        durationRange: 'medio-dia',
        difficulty: 'Moderada',
        difficultyLevel: 'media',
        priceAdult: 60000,
        priceChild: 45000,
        badge: 'Bajo las Estrellas',
        ageLimit: 'Todas las edades',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['19:30'],
        trailKey: null,
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.3530, -64.9350],
            destination: [-32.3650, -64.9200],
            time4x4: '35 min · 14,0 km',
            short4x4: '35 min (14 km)',
            desc4x4: 'Ascenso nocturno en Nissan Frontier 4x4 con iluminación auxiliar y radio VHF por la cuesta del Filo.',
            timeTrek: '1h 30m · 3,0 km',
            shortTrek: '3,0 km a pie',
            descTrek: 'Caminata nocturna con linternas frontales por senderos con miradores y reconocimiento de cielo estrellado.',
            ratio4x4Pct: 40,
            ratioTrekPct: 60
        },
        extras: [],
        fullDescription: `Viví una experiencia distinta recorriendo senderos de montaña bajo la calma de la noche serrana.

Equipados con linternas frontales provistas por el guía, avanzamos por senderos con suaves pendientes hacia miradores naturales libres de contaminación lumínica para observar constelaciones y la luz de la luna sobre el valle. Al cierre compartimos una picada serrana en grupo.`,
        includes: [
            'Linterna frontal individual incluida',
            'Picada serrana grupal al finalizar',
            'Guía baqueano habilitado',
            'Seguros de turismo aventura y traslado 4x4'
        ],
        equipment: `Calzado cómodo acordonado con buen agarre, abrigo (la temperatura desciende de noche en altura) y agua personal.`,
        notes: 'Incluye reconocimiento de constelaciones y pausa fotográfica nocturna.',
        gallery: [
            'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_nieve.jpg'
        ]
    },
    {
        id: 8,
        slug: 'los-vallecitos',
        name: 'Los Vallecitos (Parque Natural)',
        shortName: 'Parque Natural Los Vallecitos',
        subtitle:
            'Más de 1.000 hectáreas de bosques, valles colgantes, cascadas, hoyas con truchas y picada serrana incluida.',
        category: 'cascadas',
        categoryLabel: 'Parque Natural',
        duration: 'Día Completo (8 hs)',
        durationRange: 'dia-completo',
        difficulty: 'Fácil / Familiar',
        difficultyLevel: 'facil',
        priceAdult: 95000,
        priceChild: 72000,
        badge: 'Parque Natural',
        ageLimit: 'Familiar',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['08:30'],
        trailKey: null,
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.3800, -64.9100],
            destination: [-32.3950, -64.8950],
            time4x4: '50 min · 18,5 km',
            short4x4: '50 min (18,5 km)',
            desc4x4: 'Travesía 4x4 por ripio de alta montaña hasta el ingreso del Parque Natural.',
            timeTrek: '3 h · 6,0 km',
            shortTrek: '6,0 km a pie',
            descTrek: 'Senderismo relajado por praderas de altura, bosques, cascadas y hoyas con truchas.',
            ratio4x4Pct: 35,
            ratioTrekPct: 65
        },
        extras: [],
        fullDescription: `Un parque natural de más de 1.000 hectáreas de bosques y valles en el corazón de las Sierras de los Comechingones.

Pasamos una jornada completa recorriendo diferentes cascadas y sus hoyas pobladas de truchas, paseando por bosques serranos, descansando en los espacios de estancia y observando aves y fauna autóctona en su hábitat natural.`,
        includes: [
            'Entrada oficial al Parque Natural Los Vallecitos',
            'Picada serrana incluida',
            'Circuito guiado por cascadas, bosques y hoyas',
            'Guía habilitado, traslado 4x4 y seguros'
        ],
        equipment: `Calzado cómodo con agarre, protector solar, abrigo liviano, botella de agua y cámara.`,
        notes: 'Excelente opción de día completo con baja exigencia física y gran riqueza natural.',
        gallery: [
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_montana.jpg'
        ]
    },
    {
        id: 9,
        slug: 'cerro-de-las-ovejas',
        name: 'Cerro de Las Ovejas (2.280 msnm) o Cabeza del Indio',
        shortName: 'Cerro de Las Ovejas 2.280m',
        subtitle:
            'Ascenso al techo de San Luis (2.280 msnm) desde Reserva Mogote Bayo con 1.100 m de desnivel y vistas épicas.',
        category: 'cumbres',
        categoryLabel: 'Alta Cumbre',
        duration: 'Día Completo (12 hs aprox.)',
        durationRange: 'dia-completo',
        difficulty: 'Exigente (Desnivel 1.100 m)',
        difficultyLevel: 'exigente',
        priceAdult: 130000,
        priceChild: 98000,
        badge: 'Cumbre 2.280 m',
        ageLimit: 'Buena condición física',
        minPax: 1,
        maxCapacity: 8,
        image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
        vehicle: 'Nissan Frontier 4x4',
        times: ['08:00'],
        trailKey: 'cerro-de-las-ovejas',
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.3680, -64.9150],
            destination: [-32.3780, -64.8850],
            time4x4: '35 min · 14,5 km',
            short4x4: '35 min (14,5 km)',
            desc4x4: 'Aproximación logística en Nissan Frontier 4x4 equipada con VHF hasta la base de inicio.',
            timeTrek: '6–7 h · 12,0 km',
            shortTrek: '12,0 km (+1.100m)',
            descTrek: 'Ascenso continuo por Reserva Mogote Bayo y antiguos caminos serranos hasta la cumbre máxima de San Luis.',
            ratio4x4Pct: 20,
            ratioTrekPct: 80
        },
        extras: [
            {
                id: 'bastones',
                name: 'Par de bastones de trekking',
                price: 4000,
                perPerson: true,
                description: 'Muy recomendables para afrontar los 1.100 m de desnivel acumulado.'
            }
        ],
        fullDescription: `Ascenso al cerro más alto de la provincia de San Luis (2.280 msnm), en el límite con Córdoba.

Iniciamos en la Reserva Mogote Bayo (1.170 msnm) subiendo por un antiguo sendero de pobladores de la sierra con vistas panorámicas a todo el valle. Al alcanzar el filo continuamos hasta la cumbre del Cerro de Las Ovejas (o alternativa Cabeza del Indio), donde hacemos pausa de almuerzo antes del descenso.

Son 1.100 metros de desnivel positivo a ritmo constante (entre 5 y 7 horas de ascenso).`,
        includes: [
            'Guía especializado en alta montaña',
            'Seguros de turismo aventura',
            'Paso por Reserva Natural Mogote Bayo',
            'Comunicaciones VHF y equipamiento de seguridad',
            'Traslado coordinado en Nissan Frontier 4x4'
        ],
        equipment: `Calzado de trekking con excelente agarre (obligatorio), vianda para almuerzo en cumbre, 2 litros de agua mínimo, ropa en capas (cortaviento y abrigo), protector solar y gorro.`,
        notes: 'Opción Cabeza del Indio: mismo recorrido y altitud. Requiere buena preparación física.',
        gallery: [
            'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            'images/flota/nissan_frontier_nieve.jpg'
        ]
    },
    {
        id: 10,
        slug: 'experiencia-la-huertita',
        name: 'Experiencia La Huertita (Fin de Semana Todo Incluido)',
        shortName: 'Experiencia La Huertita (3 días)',
        subtitle:
            'Fin de semana exclusivo en Dique La Huertita: trekking al Cerro La Bandera, kayak, MTB, Cueva del Indio y pensión completa.',
        category: 'multiaventura',
        categoryLabel: 'Fin de Semana Multiaventura',
        duration: '3 Días / 2 Noches',
        durationRange: 'fin-de-semana',
        difficulty: 'Moderada (Multiaventura)',
        difficultyLevel: 'media',
        priceAdult: 195000,
        priceChild: 145000,
        badge: 'Todo Incluido · 3 Días',
        ageLimit: 'Cupo máx. 16 pax',
        minPax: 1,
        maxCapacity: 16,
        image: 'images/excursions/huertita/huertita_portada.png',
        vehicle: '2× Nissan Frontier 4x4 (~100 km)',
        times: ['15:00'],
        trailKey: null,
        routeInfo: {
            start: [-32.343331, -64.967337],
            trailhead: [-32.4450, -65.5500],
            destination: [-32.4600, -65.5650],
            time4x4: '1h 30m · 95 km',
            short4x4: '1h 30m (95 km)',
            desc4x4: 'Traslado ida y vuelta en ambas Nissan Frontier 4x4 hacia el Dique La Huertita en el norte puntano.',
            timeTrek: 'Trekking + Kayak + MTB',
            shortTrek: 'Trek + Kayak + Bici',
            descTrek: 'Cerro La Bandera, travesía combinada en kayak (2,5 km) y mountain bike (7 km) hasta Cueva del Indio y La Olla.',
            ratio4x4Pct: 30,
            ratioTrekPct: 70
        },
        extras: [],
        fullDescription: `TURISMO ACTIVO & SOSTENIBLE — EXPERIENCIA LA HUERTITA (3 Días / 2 Noches).
Un fin de semana exclusivo de naturaleza, agua y serranías en el Dique La Huertita, San Luis.

• DÍA 1: Check-in en Casa del Club de Pescadores frente al lago (16 plazas, hogar a leña y quincho). Trekking al Cerro La Bandera con vistas 360°, taller/bautismo de kayak en bahía protegida y cena casera.
• DÍA 2: Travesía Combinada en Espejo (Kayak 2,5 km + MTB 7 km) con encuentro arqueológico en Cueva del Indio, almuerzo en pozas de La Olla e intercambio de disciplinas al regreso. Por la noche, gran asado serrano al quincho.
• DÍA 3: Desayuno frente al espejo de agua, última remada suave y regreso coordinado a Merlo.`,
        includes: [
            'Traslado ida y vuelta desde Merlo en 2 Nissan Frontier 4x4',
            '2 noches en Casa del Club de Pescadores (exclusivo grupo)',
            'Pensión completa: 2 desayunos, 2 cenas (incluye asado) y viandas',
            'Trekking guiado al Cerro La Bandera + Kayak + Bicicletas MTB',
            'Interpretación arqueológica en Cueva del Indio y La Olla',
            '2 guías profesionales habilitados y seguros integrales'
        ],
        equipment: `Calzado deportivo/trekking, ropa cómoda y muda de recambio, traje de baño y toalla, abrigo nocturno, protector solar, gorra, linterna frontal y botella de agua.`,
        notes: 'Menores hasta 12 años: $145.000. Grupos reducidos de hasta 16 pasajeros (5 salidas anuales programadas).',
        gallery: [
            'images/excursions/huertita/huertita_portada.png',
            'images/excursions/huertita/huertita_dique.png',
            'images/excursions/huertita/huertita_kayak.png',
            'images/excursions/huertita/huertita_trekking.png',
            'images/excursions/huertita/huertita_club.png',
            'images/excursions/huertita/huertita_olla.png',
            'images/flota/nissan_frontier_montana.jpg'
        ]
    }
];

export function getExcursionById(id) {
    return EXCURSIONS.find((exc) => exc.id === Number(id)) || null;
}
