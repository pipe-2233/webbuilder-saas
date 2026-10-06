import { createId, createSection } from "./defaults";
import { PAGE_MODEL_VERSION, type PageDocument, type PageTheme, type Section, type SectionOfType } from "./schema";

/**
 * Plantillas: páginas completas listas para personalizar. Se crean siempre con
 * ids nuevos, así se pueden aplicar varias veces.
 */

type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  /** Colores para la vista previa en el editor. */
  swatch: [string, string, string];
  create: (siteName: string) => PageDocument;
};

function page(siteName: string, theme: PageTheme, sections: Section[], description: string): PageDocument {
  return { version: PAGE_MODEL_VERSION, meta: { title: siteName.slice(0, 70), description }, theme, sections };
}

/** Sección con sus props sustituidas (y lo demás tomado de los valores iniciales). */
function section<T extends Section["type"]>(
  type: T,
  props: Partial<SectionOfType<T>["props"]>,
  extra: Partial<Omit<SectionOfType<T>, "id" | "type" | "props">> = {},
): SectionOfType<T> {
  const base = createSection(type);
  return { ...base, ...extra, props: { ...base.props, ...props } } as SectionOfType<T>;
}

const links = (...labels: [string, string][]) => labels.map(([label, href]) => ({ id: createId(), label, href }));

// ---------------------------------------------------------------------------
// Inmobiliaria (inspirada en la página de referencia)
// ---------------------------------------------------------------------------

function realEstate(siteName: string): PageDocument {
  const name = siteName || "Bienes Raíces";
  const theme: PageTheme = {
    colors: { primary: "#e3b33b", background: "#0e1726", text: "#f5f5f4", muted: "#a8b3c2" },
    fonts: { heading: "montserrat", body: "inter" },
  };
  const card = (tag: string, title: string, description: string, price: string, chips: string[]) => ({
    id: createId(),
    imageUrl: "",
    tag,
    title,
    description,
    price,
    chips,
    href: "",
  });

  return page(
    name,
    theme,
    [
      section("header", { logoText: name, links: links(["Proyectos", "#proyectos"], ["Ubicación", "#ubicacion"], ["Contacto", "#contacto"]) }),
      section(
        "hero",
        {
          eyebrow: "Tuluá · Bugalagrande · Valle del Cauca",
          title: "Tu lote en el campo, a minutos de la ciudad.",
          highlight: "a minutos",
          subtitle: "Lotes campestres con escritura, servicios y financiación directa. Te asesoramos desde la primera visita hasta la firma.",
          buttonLabel: "Agenda tu visita",
          buttonHref: "#contacto",
          buttonIcon: "whatsapp",
          secondaryLabel: "Ver proyectos",
          secondaryHref: "#proyectos",
          align: "left",
        },
        { backgroundOverlay: 60, lightText: true, styles: { title: { animation: "rise-skew" }, button: { loop: "pulse" } } },
      ),
      section("stats", {
        items: [
          { id: createId(), value: "90", suffix: "", label: "meses de financiación", detail: "en Samanes del Overo" },
          { id: createId(), value: "1.000", suffix: "m²", label: "lotes desde", detail: "hasta 3.500 m² en Chancos" },
          { id: createId(), value: "5", suffix: "min", label: "de Tuluá", detail: "sector Chancos, junto a Comfandi" },
        ],
      }),
      section("showcase", {
        eyebrow: "Proyecto destacado",
        title: "Samanes del Overo",
        subtitle: "Lotes campestres sobre la doble calzada, entre Bugalagrande y Tuluá. Para construir tu casa, invertir o asegurar patrimonio.",
        specsTitle: "Lotes disponibles",
        specs: [
          { id: createId(), label: "Área", value: "1.000 a 1.770 m²" },
          { id: createId(), label: "Lotes campestres", value: "desde $150.000.000" },
          { id: createId(), label: "Lote comercial", value: "$250.000.000" },
          { id: createId(), label: "Financiación", value: "hasta 90 meses" },
          { id: createId(), label: "Servicios", value: "Agua, energía, alcantarillado" },
          { id: createId(), label: "Ubicación", value: "~15 min de Tuluá" },
        ],
        buttonLabel: "Pedir mapas y precios",
        buttonIcon: "whatsapp",
      }, { styles: { image: { animation: "spotlight" } } }),
      section("cards", {
        eyebrow: "Más oportunidades",
        title: "Lotes y terrenos en el centro del Valle",
        subtitle: "Campestres, comerciales y de inversión. Escríbenos y te contamos cuáles siguen disponibles.",
        items: [
          card("Chancos · Tuluá", "Lotes Campestres Comfandi", "Junto al centro recreacional Comfandi, a 2 minutos de la doble calzada Tuluá–Buga. Escrituras inmediatas.", "$115.000 por m²", ["1.000 – 3.500 m²", "Cuota inicial 30%", "Hasta 5 años"]),
          card("Doble calzada", "Súper lote campestre", "A orilla de la doble calzada, 16 minutos de Tuluá y 2 de Bugalagrande. Con licencias, escrituras, agua y energía.", "$295.000.000 con financiación", ["17.531 m²", "Licencias", "Escrituras"]),
          card("Andalucía", "Portal Verde", "El lote campestre para la casa que sueñas. Lotes pequeños con financiación directa para empezar ya.", "Hasta 18 meses de financiación", ["300 – 500 m²", "Financiamos tu lote"]),
          card("La Tulia", "Mirador El Filo", "Finca con punto de negocio y una vista que domina todo el Valle del Cauca.", "$295.000.000 precio especial", ["9.193 m²", "Punto de negocio"]),
          card("Sevilla", "Balcones de Sevilla", "Lotes de montaña en el sector Tres Esquinas, con clima fresco y vista abierta al paisaje cafetero.", "Consulta disponibilidad", ["Sector Tres Esquinas", "Montaña"]),
          card("Bugalagrande", "3 plazas sobre la doble calzada", "Terreno de inversión a la orilla de la doble calzada, ideal para bodegas, cultivo o proyecto comercial.", "Consulta precio actualizado", ["3 plazas", "Inversión"]),
        ],
        note: "Precios tomados de nuestras publicaciones. Pueden cambiar; confirma disponibilidad y valor por WhatsApp.",
      }, { styles: { items: { animation: "blur-in" } } }),
      section("features", {
        title: "Compra tu lote con tranquilidad",
        items: [
          { id: createId(), icon: "document", title: "Escrituras al día", description: "Lotes con escritura independiente y, en varios proyectos, escrituración inmediata." },
          { id: createId(), icon: "wallet", title: "Financiación directa", description: "Planes desde 18 meses hasta 90 meses, sin pasar por el banco." },
          { id: createId(), icon: "zap", title: "Servicios listos", description: "Agua, energía y alcantarillado para que empieces a construir sin demoras." },
          { id: createId(), icon: "location", title: "Ubicación estratégica", description: "Proyectos cerca de la doble calzada Tuluá–Buga, con acceso fácil y alta valorización." },
        ],
      }),
      section("steps", {
        eyebrow: "Dónde estamos",
        title: "Desde Tuluá, para todo el centro del Valle",
        subtitle: "Nuestros proyectos están sobre el eje de la doble calzada Tuluá–Buga y en las montañas del norte del Valle.",
        items: [
          { id: createId(), title: "Tuluá", description: "Punto de partida · asesoría y visitas", value: "0 min" },
          { id: createId(), title: "Chancos", description: "Lotes Campestres Comfandi", value: "5 min" },
          { id: createId(), title: "Samanes del Overo", description: "Por doble calzada", value: "~15 min" },
          { id: createId(), title: "Bugalagrande", description: "Súper lote y 3 plazas", value: "16 min" },
          { id: createId(), title: "Andalucía · La Tulia · Sevilla", description: "Portal Verde, Mirador El Filo, Balcones", value: "Norte del Valle" },
        ],
      }),
      section("contact", {
        eyebrow: "Asesoría inmobiliaria",
        title: "Te ayudamos a encontrar la propiedad ideal.",
        subtitle: "Escríbenos para separar tu cita. Te enviamos mapas, precios y opciones de financiación, y te acompañamos a conocer el lote.",
        contactName: "Tu nombre",
        phone: "300 000 0000",
        countryCode: "57",
        whatsappMessage: "Hola, quiero información sobre los lotes.",
        buttonLabel: "Escribir por WhatsApp",
        instagram: "@tunegocio",
      }),
      section("footer", { text: `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.` }),
    ],
    "Lotes campestres con escritura, servicios y financiación directa.",
  );
}

// ---------------------------------------------------------------------------
// Restaurante o café
// ---------------------------------------------------------------------------

function restaurant(siteName: string): PageDocument {
  const name = siteName || "Mi restaurante";
  return page(
    name,
    {
      colors: { primary: "#b45309", background: "#fffbeb", text: "#292524", muted: "#78716c" },
      fonts: { heading: "playfair-display", body: "lato" },
    },
    [
      section("header", { logoText: name, links: links(["Menú", "#menu"], ["Horarios", "#horarios"], ["Reservas", "#contacto"]) }),
      section("hero", {
        eyebrow: "Cocina casera · desde 2010",
        title: "Sabores que se quedan en la memoria.",
        highlight: "en la memoria",
        subtitle: "Ingredientes frescos, recetas de familia y un lugar para compartir.",
        buttonLabel: "Reservar mesa",
        buttonHref: "#contacto",
        buttonIcon: "calendar",
        secondaryLabel: "Ver el menú",
        secondaryHref: "#menu",
        align: "center",
      }, { styles: { title: { animation: "blur-in" } } }),
      section("cards", {
        eyebrow: "Nuestro menú",
        title: "Los favoritos de la casa",
        subtitle: "",
        items: [
          { id: createId(), imageUrl: "", tag: "Entrada", title: "Empanadas de la abuela", description: "Crujientes, con ají casero.", price: "$12.000", chips: ["Para compartir"], href: "" },
          { id: createId(), imageUrl: "", tag: "Plato fuerte", title: "Bandeja tradicional", description: "Frijoles, arroz, chicharrón y aguacate.", price: "$32.000", chips: ["Más pedido"], href: "" },
          { id: createId(), imageUrl: "", tag: "Postre", title: "Postre de natas", description: "Receta de familia.", price: "$9.000", chips: [], href: "" },
        ],
        note: "",
      }),
      section("stats", {
        items: [
          { id: createId(), value: "15", suffix: "años", label: "cocinando", detail: "" },
          { id: createId(), value: "4.800", suffix: "+", label: "clientes felices", detail: "" },
          { id: createId(), value: "100", suffix: "%", label: "ingredientes frescos", detail: "" },
        ],
      }),
      section("steps", {
        eyebrow: "Horarios",
        title: "Te esperamos",
        subtitle: "",
        items: [
          { id: createId(), title: "Lunes a viernes", description: "Almuerzos y cenas", value: "12 m – 9 p. m." },
          { id: createId(), title: "Sábados", description: "Todo el día", value: "11 a. m. – 10 p. m." },
          { id: createId(), title: "Domingos y festivos", description: "Almuerzos", value: "11 a. m. – 4 p. m." },
        ],
      }),
      section("contact", {
        eyebrow: "Reservas y domicilios",
        title: "Escríbenos y separa tu mesa.",
        subtitle: "Respondemos rápido por WhatsApp.",
        phone: "300 000 0000",
        countryCode: "57",
        whatsappMessage: "Hola, quiero hacer una reserva.",
        buttonLabel: "Reservar por WhatsApp",
        instagram: "@turestaurante",
      }),
      section("footer", { text: `© ${new Date().getFullYear()} ${name}.` }),
    ],
    "Cocina casera, ingredientes frescos y reservas por WhatsApp.",
  );
}

// ---------------------------------------------------------------------------
// Servicios profesionales
// ---------------------------------------------------------------------------

function services(siteName: string): PageDocument {
  const name = siteName || "Mi empresa";
  return page(
    name,
    {
      colors: { primary: "#2563eb", background: "#ffffff", text: "#0f172a", muted: "#64748b" },
      fonts: { heading: "poppins", body: "inter" },
    },
    [
      section("header", { logoText: name, links: links(["Servicios", "#servicios"], ["Proceso", "#proceso"], ["Contacto", "#contacto"]) }),
      section("hero", {
        eyebrow: "Asesoría profesional",
        title: "Soluciones claras para hacer crecer tu negocio.",
        highlight: "crecer tu negocio",
        subtitle: "Te acompañamos con un plan a tu medida, sin complicaciones.",
        buttonLabel: "Agenda una llamada",
        buttonHref: "#contacto",
        buttonIcon: "phone",
        secondaryLabel: "Ver servicios",
        secondaryHref: "#servicios",
        align: "left",
      }, { styles: { title: { animation: "curtain" } } }),
      section("stats", {
        items: [
          { id: createId(), value: "250", suffix: "+", label: "clientes atendidos", detail: "" },
          { id: createId(), value: "12", suffix: "años", label: "de experiencia", detail: "" },
          { id: createId(), value: "98", suffix: "%", label: "recomiendan", detail: "" },
        ],
      }),
      section("features", {
        title: "Lo que hacemos por ti",
        items: [
          { id: createId(), icon: "check", title: "Diagnóstico", description: "Entendemos tu situación antes de proponer nada." },
          { id: createId(), icon: "key", title: "Plan a tu medida", description: "Pasos concretos, plazos y costos claros." },
          { id: createId(), icon: "users", title: "Acompañamiento", description: "Estamos contigo hasta ver resultados." },
        ],
      }),
      section("steps", {
        eyebrow: "Cómo trabajamos",
        title: "Un proceso sencillo",
        subtitle: "",
        items: [
          { id: createId(), title: "Conversamos", description: "Una llamada sin compromiso", value: "Paso 1" },
          { id: createId(), title: "Te proponemos un plan", description: "Con objetivos y presupuesto", value: "Paso 2" },
          { id: createId(), title: "Lo ponemos en marcha", description: "Y medimos los resultados", value: "Paso 3" },
        ],
      }),
      section("contact", {
        eyebrow: "Hablemos",
        title: "Cuéntanos qué necesitas.",
        subtitle: "Te respondemos el mismo día.",
        phone: "300 000 0000",
        countryCode: "57",
        whatsappMessage: "Hola, quiero agendar una llamada.",
        buttonLabel: "Escribir por WhatsApp",
        email: "hola@tuempresa.com",
      }),
      section("footer", { text: `© ${new Date().getFullYear()} ${name}.` }),
    ],
    "Asesoría profesional con un plan a tu medida.",
  );
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "inmobiliaria",
    name: "Inmobiliaria",
    description: "Lotes, casas o proyectos: cifras, proyecto destacado, tarjetas con precio y contacto por WhatsApp.",
    swatch: ["#0e1726", "#e3b33b", "#f5f5f4"],
    create: realEstate,
  },
  {
    id: "restaurante",
    name: "Restaurante o café",
    description: "Menú con precios, horarios y reservas por WhatsApp.",
    swatch: ["#fffbeb", "#b45309", "#292524"],
    create: restaurant,
  },
  {
    id: "servicios",
    name: "Servicios profesionales",
    description: "Para consultores, agencias o profesionales independientes.",
    swatch: ["#ffffff", "#2563eb", "#0f172a"],
    create: services,
  },
];
