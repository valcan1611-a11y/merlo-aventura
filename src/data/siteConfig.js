/**
 * Configuración centralizada de Merlo Aventura.
 * Única fuente de verdad para marca, contacto, zonas de pick-up,
 * datos bancarios por defecto, flota, pasos, testimonios y FAQ.
 */

export const SITE_CONFIG = {
    brand: {
        name: 'Merlo Aventura',
        shortName: 'MERLO AVENTURA',
        tagline: 'Trekking, Senderismo & Travesías 4x4 • San Luis',
        location: 'Villa de Merlo, San Luis, Argentina',
        region: 'Sierras de los Comechingones',
        year: 2026,
        seasonNotice: 'Temporada 2026 abierta · Cupos reducidos en 2 Nissan Frontier 4x4'
    },
    defaults: {
        whatsappRaw: '5492664123456',
        whatsappDisplay: '+54 9 2664 12-3456',
        email: 'reservas@merloaventura.com.ar',
        address: 'Av. del Sol 650, Villa de Merlo, San Luis',
        hours: 'Todos los días de 8:00 a 22:00 hs',
        instagramUrl: 'https://www.instagram.com/merlo_aventura/',
        facebookUrl: 'https://www.facebook.com/',
        bankAlias: 'MERLO.AVENTURA.4X4',
        bankCbu: '0070123430004059683921',
        bankHolder: 'Merlo Aventura SRL',
        bankCuit: '30-71829384-9',
        bankName: 'Banco Galicia / Mercado Pago',
        mpCheckoutUrl: '',
        mpMode: 'demo', // 'link' | 'demo'
        adminPin: 'admin2026'
    },
    hero: {
        videoSources: ['hero.mp4', 'videos/hero.mp4', 'static/videos/hero.mp4'],
        poster: 'images/hero-poster.jpg',
        eyebrow: 'Villa de Merlo · Sierras de los Comechingones',
        headlinePrefix: 'Descubrí las Sierras',
        headlineAccent: 'Caminando',
        subtitle:
            'Trekking guiado a cascadas secretas, pueblos mineros y cumbres de San Luis. Nuestras dos camionetas Nissan Frontier 4x4 te acercan por caminos de alta montaña hasta el inicio de cada sendero.',
        trustBadges: [
            { icon: 'fa-solid fa-truck-pickup', label: '2× Nissan Frontier 4x4' },
            { icon: 'fa-solid fa-user-shield', label: 'Guías Habilitados' },
            { icon: 'fa-solid fa-shield-heart', label: 'Seguro Aventura' },
            { icon: 'fa-solid fa-location-dot', label: 'Pick-up Incluido' }
        ]
    },
    pickupZones: [
        { value: 'Villa de Merlo (Centro / Av. del Sol)', label: 'Villa de Merlo — Centro / Av. del Sol (Sin cargo)' },
        { value: 'Piedra Blanca / Rincón del Este', label: 'Piedra Blanca / Rincón del Este (Sin cargo)' },
        { value: 'Cerro de Oro', label: 'Cerro de Oro (Sin cargo)' },
        { value: 'Carpintería', label: 'Carpintería (Sin cargo)' },
        { value: 'Los Molles / Cortaderas', label: 'Los Molles / Cortaderas (A coordinar horario)' },
        { value: 'Base Operativa Av. del Sol 650', label: 'Me acerco a Base Operativa (Av. del Sol 650)' }
    ],
    fleet: {
        title: 'Nuestra Flota: 2 Nissan Frontier 4x4',
        eyebrow: 'APOYO LOGÍSTICO Y TRASLADOS',
        description:
            'Para caminar los mejores senderos de altura, primero hay que llegar. Nuestras dos Nissan Frontier 4x4 equipadas para montaña te llevan por huellas de roca, arroyos y cuestas hasta el punto exacto de partida.',
        cards: [
            {
                image: 'images/flota/nissan_frontier_montana.jpg',
                alt: 'Dos camionetas Nissan Frontier 4x4 en caravana de alta montaña',
                badge: 'Caravana en Altura',
                badgeColor: 'amber',
                title: 'Dos Unidades en Sintonía',
                description:
                    'Operamos en caravana por caminos de alta montaña y quebradas técnicas con respaldo mecánico y enlace radial permanente.',
                footerIcon: 'fa-solid fa-mountain',
                footerText: 'Sierras de los Comechingones',
                footerColor: 'amber'
            },
            {
                image: 'images/flota/nissan_frontier_aerea.jpg',
                alt: 'Nissan Frontier 4x4 con snorkel de vadeo, baca de expedición y barra LED',
                badge: 'Equipamiento Off-Road',
                badgeColor: 'emerald',
                title: 'Snorkel, Baca & Barra LED',
                description:
                    'Snorkel de vadeo para arroyos serranos, paragolpes reforzado, cubiertas AT, baca portaequipo e iluminación LED auxiliar.',
                footerIcon: 'fa-solid fa-shield-halved',
                footerText: '100% Habilitadas y Aseguradas',
                footerColor: 'emerald'
            },
            {
                image: 'images/flota/nissan_frontier_nieve.jpg',
                alt: 'Nissan Frontier 4x4 circulando en nieve serrana',
                badge: 'Clima Extremo',
                badgeColor: 'sky',
                title: 'Preparadas Todo el Año',
                description:
                    'Tracción integral con alta y baja para transitar con seguridad en barro, piedra suelta, escarcha o nevadas invernales.',
                footerIcon: 'fa-solid fa-snowflake',
                footerText: 'Tracción 4x4 Alta y Baja',
                footerColor: 'sky'
            }
        ],
        specs: [
            {
                icon: 'fa-solid fa-truck-monster',
                title: 'Tracción 4x4 & Reductora',
                description: 'Acceso seguro a vados de arroyo, trepadas de piedra y filos de más de 2.000 msnm.'
            },
            {
                icon: 'fa-solid fa-tower-broadcast',
                title: 'Comunicaciones VHF',
                description: 'Enlace radial constante entre ambas unidades y la base operativa en Merlo.'
            },
            {
                icon: 'fa-solid fa-temperature-arrow-up',
                title: 'Cabina Climatizada',
                description: 'Calefacción y aire acondicionado para viajar cómodos en verano o invierno.'
            },
            {
                icon: 'fa-solid fa-users',
                title: 'Grupos Reducidos',
                description: 'Hasta 8 pasajeros por salida para atención personalizada y ritmo cuidado.'
            }
        ]
    },
    howItWorks: [
        {
            step: '1',
            title: 'Elegí Circuito y Fecha',
            description:
                'Compará tramo en 4x4 vs caminata, mirá el recorrido en el Visor GPS 3D y elegí fecha, turno y cantidad de pasajeros.',
            pillIcon: 'fa-solid fa-circle-check',
            pillText: 'Cupos en tiempo real por salida',
            pillColor: 'amber'
        },
        {
            step: '2',
            title: 'Aboná como Prefieras',
            description:
                'Pagá online con Mercado Pago o reservá por Transferencia Bancaria con Alias/CBU copiable y envío directo del comprobante por WhatsApp.',
            pillIcon: 'fa-solid fa-lock',
            pillText: 'Mercado Pago & Transferencia',
            pillColor: 'sky'
        },
        {
            step: '3',
            title: 'Te Buscamos en tu Alojamiento',
            description:
                'Recibís tu voucher digital con código único. El día pactado pasamos en Nissan Frontier 4x4 por tu hotel o cabaña.',
            pillIcon: 'fa-solid fa-location-dot',
            pillText: 'Pick-up Merlo, Carpintería y Cerro de Oro',
            pillColor: 'emerald'
        }
    ],
    testimonials: [
        {
            initials: 'MB',
            name: 'Martín Berardi',
            city: 'Buenos Aires',
            tour: 'Pueblo Escondido y Salto del Tigre',
            quote:
                'La combinación de aproximación en las Nissan Frontier y el trekking al pueblo minero es espectacular. Los guías cuidan cada detalle del ritmo y la seguridad.'
        },
        {
            initials: 'LP',
            name: 'Lorena Pereyra',
            city: 'Rosario, Santa Fe',
            tour: 'Trekking Nocturno',
            quote:
                'Hicimos el trekking nocturno con linternas frontales y la picada serrana al final. Ver el cielo estrellado desde el filo de los Comechingones fue inolvidable.'
        },
        {
            initials: 'GF',
            name: 'Gonzalo Fernández',
            city: 'Córdoba Capital',
            tour: 'Salto del Tabaquillo',
            quote:
                'Reservamos online en dos minutos, nos pasaron a buscar puntuales por la cabaña en Cerro de Oro y el sendero entre arroyos y tabaquillos fue un diez.'
        }
    ],
    faq: [
        {
            question: '¿Nos pasan a buscar por nuestro alojamiento?',
            answer:
                'Sí. Incluimos pick-up y regreso en hoteles, cabañas y posadas de Villa de Merlo, Piedra Blanca, Rincón del Este, Cerro de Oro y Carpintería. Al reservar elegís tu zona y dejás el nombre o dirección del alojamiento.'
        },
        {
            question: '¿Cómo se combina la camioneta 4x4 con el trekking a pie?',
            answer:
                'En cada ficha de excursión vas a ver el desglose exacto de tiempo y kilómetros en Nissan Frontier 4x4 (para salvar los caminos de ripio y altura) y cuánto se camina a pie por el sendero junto al guía habilitado.'
        },
        {
            question: '¿Qué excursiones son recomendables para familias o niños?',
            answer:
                'Cascada Hoya de Piedra (Quebrada El Molino) y Parque Natural Los Vallecitos son de dificultad baja/fácil, ideales para familias. Pueblo Escondido, Salto del Tabaquillo y Salto del Tigre requieren edad mínima de 7 años o movilidad estándar.'
        },
        {
            question: '¿Qué calzado e indumentaria necesito llevar?',
            answer:
                'Calzado acordonado con buen agarre (trekking o deportivo), mochila chica, botella de agua, protector solar, gorra, lentes de sol y un abrigo liviano. En altura la temperatura baja incluso en verano.'
        },
        {
            question: '¿Cómo funcionan los pagos con Mercado Pago y Transferencia?',
            answer:
                'Podés abonar por Mercado Pago o elegir Transferencia Bancaria: el sistema genera un código único (MA-XXXXX), te muestra Alias y CBU con botón de copiado y arma automáticamente el mensaje de WhatsApp para enviarnos el comprobante.'
        },
        {
            question: '¿Qué pasa si hay mal clima en la sierra?',
            answer:
                'La seguridad es prioridad. Si hay alerta meteorológica que impida operar en alta montaña, reprogramamos la salida para otro día disponible sin costo adicional o coordinamos la devolución de tu seña/reserva.'
        }
    ]
};
