const SHEET_ID = '1tztr4JB0NAn_NjNlwF6h-lXo-0Jb90olQc-yZBNuGEU';

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setupSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Renombrar la primera hoja a Ventas si no se llama así y no existe
  let primeraHoja = ss.getSheets()[0];
  if (primeraHoja.getName() !== "Ventas" && !ss.getSheetByName("Ventas")) {
    primeraHoja.setName("Ventas");
  }
  
  const sheetVentas = getOrCreateSheet(ss, "Ventas");
  const sheetAlquileres = getOrCreateSheet(ss, "Alquileres");
  
  const headersVentas = [
    "ID", "Fecha", "URL", "Título", "Ubicación", "Moneda Orig", "Precio Orig", "Superficie (m2)", 
    "Dormitorios", "Baños", "Garajes", "Piscina", "Amoblado",
    "Alquiler Orig", "Gastos Com. Orig", "Precio (USD)", "Precio (PYG)", "Precio (EUR)", 
    "Flujo Neto Mes (USD)", "Flujo Neto Mes (PYG)", "Flujo Neto Mes (EUR)", "Rentabilidad Bruta (%)"
  ];
  
  const headersAlquileres = [
    "ID", "Fecha", "URL", "Título", "Ubicación", "Moneda Orig", "Precio Orig (Alquiler)", "Superficie (m2)", 
    "Dormitorios", "Baños", "Garajes", "Piscina", "Amoblado",
    "Gastos Com. Orig", "Precio (USD)", "Precio (PYG)", "Precio (EUR)"
  ];
  
  [ {sheet: sheetVentas, headers: headersVentas}, 
    {sheet: sheetAlquileres, headers: headersAlquileres} ].forEach(obj => {
    if (obj.sheet.getLastRow() === 0) {
      obj.sheet.getRange(1, 1, 1, obj.headers.length).setValues([obj.headers]);
      obj.sheet.getRange(1, 1, 1, obj.headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      obj.sheet.setFrozenRows(1);
    } else {
      obj.sheet.getRange(1, 1, 1, obj.headers.length).setValues([obj.headers]);
    }
  });
}

function doGet(e) {
  try {
    const ubicacion = e.parameter.ubicacion || "";
    const dormitorios = Number(e.parameter.dormitorios);
    const banos = Number(e.parameter.banos);
    const piscina = e.parameter.piscina || "No";
    const amoblado = e.parameter.amoblado || "No";
    const m2 = Number(e.parameter.m2) || 0;
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetAlquileres = ss.getSheetByName("Alquileres");
    if (!sheetAlquileres || sheetAlquileres.getLastRow() < 2) {
       return ContentService.createTextOutput(JSON.stringify({status: "success", average: null, count: 0})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Leer datos
    const data = sheetAlquileres.getRange(2, 1, sheetAlquileres.getLastRow() - 1, 15).getValues();
    // Índices (basados en headersAlquileres):
    // Ubicación: 4, Superficie: 7, Dorm: 8, Baños: 9, Piscina: 11, Amoblado: 12, Precio USD: 14
    
    // Filtrar coincidencias
    let matches = data.filter(row => {
      if (row[4] !== ubicacion) return false;
      if (Number(row[8]) !== dormitorios) return false;
      if (Number(row[9]) !== banos) return false;
      if (row[11] !== piscina) return false;
      if (row[12] !== amoblado) return false;
      if (m2 > 0) {
         let rowM2 = Number(row[7]);
         if (rowM2 > 0 && Math.abs(rowM2 - m2) > 20) return false;
      }
      return true;
    });
    
    // Fallback 1: Ignorar m2 exacto
    if (matches.length === 0) {
       matches = data.filter(row => row[4] === ubicacion && Number(row[8]) === dormitorios && Number(row[9]) === banos && row[11] === piscina && row[12] === amoblado);
    }
    // Fallback 2: Ignorar amoblado y piscina
    if (matches.length === 0) {
       matches = data.filter(row => row[4] === ubicacion && Number(row[8]) === dormitorios && Number(row[9]) === banos);
    }
    // Fallback 3: Ignorar baños
    if (matches.length === 0) {
       matches = data.filter(row => row[4] === ubicacion && Number(row[8]) === dormitorios);
    }
    // Fallback 3: Solo zona
    if (matches.length === 0) {
       matches = data.filter(row => row[4] === ubicacion);
    }
    
    if (matches.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({status: "success", average: null, count: 0})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Calcular promedio del "Precio (USD)"
    let sum = 0;
    let validCount = 0;
    matches.forEach(row => {
       // Si el precio USD está calculado con fórmula, getValues() trae el valor final
       let usdVal = Number(row[14]); 
       if (!isNaN(usdVal) && usdVal > 0) {
         sum += usdVal;
         validCount++;
       }
    });
    
    let average = validCount > 0 ? (sum / validCount) : null;
    
    return ContentService.createTextOutput(JSON.stringify({
       status: "success", 
       average: average, 
       count: validCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const operacion = (data.operacion || "venta").toLowerCase();
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = operacion === "alquiler" ? "Alquileres" : "Ventas";
    const sheet = getOrCreateSheet(ss, sheetName);
    
    const newRow = sheet.getLastRow() + 1;
    const id = (operacion === "alquiler" ? "ALQ-" : "DEP-") + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    const date = new Date();
    
    const url = data.url || "";
    const title = data.titulo || "";
    const ubicacion = data.ubicacion || "";
    const currency = (data.moneda || "USD").toUpperCase();
    const price = Number(data.precio) || 0;
    
    // VERIFICACIÓN DE DUPLICADOS en la hoja correspondiente
    if (url !== "" && sheet.getLastRow() > 1) {
      const existingUrls = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
      const isDuplicate = existingUrls.some(row => row[0] === url);
      if (isDuplicate) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "duplicate", 
          message: "Este inmueble ya existe en la base de datos."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    const m2 = Number(data.superficie) || 0;
    const dormitorios = Number(data.dormitorios) || "";
    const banos = Number(data.banos) || "";
    const garajes = Number(data.garajes) || "";
    const piscina = data.piscina || "No";
    const amoblado = data.amoblado || "No";
    const rent = Number(data.alquiler) || 0;
    const community = Number(data.comunidad) || 0;
    
    const getConversionFormula = (targetCurrency, originalValueCell) => {
      if (currency === targetCurrency) return `=${originalValueCell}`;
      return `=${originalValueCell}*GOOGLEFINANCE("CURRENCY:${currency}${targetCurrency}")`;
    };
    
    let rowData;
    if (operacion === "alquiler") {
      // G: Precio Orig (7), N: Gastos Com (13) -> Wait
      // A:ID, B:Fecha, C:URL, D:Título, E:Ubicación, F:Moneda, G:Precio
      // H:m2, I:Dormitorios, J:Baños, K:Garajes, L:Piscina, M:Amoblado
      // N:Gastos Com.
      rowData = [
        id, date, url, title, ubicacion, currency, price, m2, dormitorios, banos, garajes, piscina, amoblado,
        community,
        getConversionFormula("USD", `G${newRow}`), // O: Precio USD
        getConversionFormula("PYG", `G${newRow}`), // P: Precio PYG
        getConversionFormula("EUR", `G${newRow}`)  // Q: Precio EUR
      ];
    } else {
      // Ventas
      // A:ID, B:Fecha, C:URL, D:Título, E:Ubicación, F:Moneda, G:Precio
      // H:m2, I:Dormitorios, J:Baños, K:Garajes, L:Piscina, M:Amoblado
      // N:Alquiler Orig, O:Gastos Com.
      rowData = [
        id, date, url, title, ubicacion, currency, price, m2, dormitorios, banos, garajes, piscina, amoblado,
        rent, community,
        getConversionFormula("USD", `G${newRow}`), // P: Precio USD
        getConversionFormula("PYG", `G${newRow}`), // Q: Precio PYG
        getConversionFormula("EUR", `G${newRow}`), // R: Precio EUR
        getConversionFormula("USD", `(N${newRow}-O${newRow})`), // S: Flujo USD
        getConversionFormula("PYG", `(N${newRow}-O${newRow})`), // T: Flujo PYG
        getConversionFormula("EUR", `(N${newRow}-O${newRow})`), // U: Flujo EUR
        price > 0 ? `=((N${newRow}-O${newRow})*12)/G${newRow}` : "0" // V: Rentabilidad
      ];
    }
    
    sheet.appendRow(rowData);
    if (operacion === "venta") {
      sheet.getRange(newRow, 22).setNumberFormat("0.00%");
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", row: newRow}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (e.range.getRow() === 1) return;
  e.range.setBackground("#fff2cc");
}
