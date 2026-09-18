// Script para extraer datos inteligentes de la web inmobiliaria (ej. InfoCasas)
(function() {
  const text = document.body.innerText;
  const html = document.body.innerHTML;
  
  let result = {
    operacion: "venta",
    title: document.title,
    ubicacion: "",
    price: "",
    currency: "",
    m2: "",
    dormitorios: "",
    banos: "",
    garajes: "",
    piscina: "No"
  };

  // DETECTAR TIPO DE OPERACIÓN (Venta o Alquiler)
  if (text.match(/Precio\s*de\s*alquiler/i) || text.match(/Alquiler\s*mensual/i)) {
    result.operacion = "alquiler";
  }

  // EXTRAER UBICACIÓN
  // Busca "Ubicación Principal" y coge la siguiente línea de texto
  let ubicacionMatch = text.match(/Ubicación Principal[\s\n]+([^\n]+)/i);
  if (!ubicacionMatch) {
    ubicacionMatch = text.match(/Ubicación[\s\n]+([^\n]+)/i);
  }
  if (ubicacionMatch && ubicacionMatch[1]) {
    let ubi = ubicacionMatch[1].trim();
    // Filtro de cordura para no coger párrafos enteros
    if (ubi.length > 3 && ubi.length < 80) {
      result.ubicacion = ubi;
    }
  }

  // 1. EXTRAER PRECIO Y MONEDA
  let priceMatch = text.match(/(U\$S|USD|US\$|\$|PYG|Gs\.?|₲|Guaraníes)\s*([\d\.,]+)\s*Precio\s*de\s*(venta|alquiler)/i);
  if (!priceMatch) {
    // Probar sin el texto explícito si no hay coincidencia
    priceMatch = text.match(/(U\$S|USD|US\$|\$|PYG|Gs\.?|₲|Guaraníes)\s*([\d\.,]+)/i);
  }

  if (priceMatch) {
    let currRaw = priceMatch[1].toUpperCase();
    if (currRaw.includes("PYG") || currRaw.includes("GS") || currRaw.includes("₲") || currRaw.includes("GUARAN")) {
        result.currency = "PYG";
    } else {
        result.currency = "USD";
    }
    result.price = priceMatch[2].replace(/[\.,]/g, '');
  }

  // 2. EXTRAER SUPERFICIE
  let m2Match = text.match(/(?:Total\s*Mts²|Superficie|Área|Area)[\s\n:]*(\d+)/i) || 
                text.match(/(\d+)\s*(?:m2|m²|m 2|metros)/i);
  if (m2Match) result.m2 = m2Match[1];

  // Función inteligente para evitar números ridículos (como recoger los m2 como baños)
  function extractFeature(regexes) {
    for (let r of regexes) {
      let m = text.match(r);
      if (m && m[1]) {
        let val = parseInt(m[1], 10);
        // Filtro de cordura: nadie vende una casa con 80 baños o 80 dormitorios
        if (val > 0 && val < 20) {
          return val.toString();
        }
      }
    }
    return "";
  }

  // 3. EXTRAER DORMITORIOS
  result.dormitorios = extractFeature([
    /(\d{1,2})\s*(?:Dormitorios|Dorms|Dorm|Habitaciones|Habitación|Hab)/i,
    /(?:Dormitorios|Dorms|Dorm|Habitaciones|Habitación|Hab)[\s\n:]+(\d{1,2})/i
  ]);

  // 4. EXTRAER BAÑOS
  // Priorizamos buscar el número ANTES de la palabra (ej. "2 Baños") para evitar el error de "Baños 80m2"
  result.banos = extractFeature([
    /(\d{1,2})\s*(?:Baños|Baño|Toilets|Aseos)/i,
    /(?:Baños|Baño|Toilets|Aseos)[\s\n:]+(\d{1,2})/i
  ]);

  // 5. EXTRAER GARAJES
  result.garajes = extractFeature([
    /(\d{1,2})\s*(?:Garajes|Garaje|Cocheras|Cochera|Estacionamientos|Estacionamiento)/i,
    /(?:Garajes|Garaje|Cocheras|Cochera|Estacionamientos|Estacionamiento)[\s\n:]+(\d{1,2})/i
  ]);

  // 6. EXTRAER PISCINA
  if (text.match(/piscina|pileta|alberca/i)) {
      result.piscina = "Sí";
  }

  return result;
})();
