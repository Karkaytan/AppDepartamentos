const SHEET_ID = '1tztr4JB0NAn_NjNlwF6h-lXo-0Jb90olQc-yZBNuGEU';

function setupSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const headers = [
    "ID", "Fecha", "URL", "Título", "Ubicación", "Moneda Orig", "Precio Orig", "Superficie (m2)", 
    "Dormitorios", "Baños", "Garajes", "Piscina",
    "Alquiler Orig", "Gastos Com. Orig", "Precio (USD)", "Precio (PYG)", "Precio (EUR)", 
    "Flujo Neto Mes (USD)", "Flujo Neto Mes (PYG)", "Flujo Neto Mes (EUR)", "Rentabilidad Bruta (%)"
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  } else {
    // Si ya hay cabeceras viejas, las sobreescribimos para tener las nuevas columnas
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const data = JSON.parse(e.postData.contents);
    
    const newRow = sheet.getLastRow() + 1;
    const id = "DEP-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    const date = new Date();
    
    // Original data
    const url = data.url || "";
    const title = data.titulo || "";
    const ubicacion = data.ubicacion || "";
    const currency = (data.moneda || "USD").toUpperCase();
    const price = Number(data.precio) || 0;
    
    // VERIFICACIÓN DE DUPLICADOS: Comprobar si la URL ya existe en la Columna C (3)
    if (url !== "" && sheet.getLastRow() > 1) {
      const existingUrls = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
      const isDuplicate = existingUrls.some(row => row[0] === url);
      
      if (isDuplicate) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "duplicate", 
          message: "Este departamento ya existe en la base de datos."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    const m2 = Number(data.superficie) || 0;
    const dormitorios = Number(data.dormitorios) || "";
    const banos = Number(data.banos) || "";
    const garajes = Number(data.garajes) || "";
    const piscina = data.piscina || "No";
    
    const rent = Number(data.alquiler) || 0;
    const community = Number(data.comunidad) || 0;
    
    const getConversionFormula = (targetCurrency, originalValueCell) => {
      if (currency === targetCurrency) return `=${originalValueCell}`;
      return `=${originalValueCell}*GOOGLEFINANCE("CURRENCY:${currency}${targetCurrency}")`;
    };
    
    // Mapeo de columnas A - U (21 columnas)
    // G: Precio Orig (7)
    // M: Alquiler Orig (13)
    // N: Gastos Com. Orig (14)
    const rowData = [
      id, // A
      date, // B
      url, // C
      title, // D
      ubicacion, // E
      currency, // F
      price, // G
      m2, // H
      dormitorios, // I
      banos, // J
      garajes, // K
      piscina, // L
      rent, // M
      community, // N
      getConversionFormula("USD", `G${newRow}`), // O: Precio USD
      getConversionFormula("PYG", `G${newRow}`), // P: Precio PYG
      getConversionFormula("EUR", `G${newRow}`), // Q: Precio EUR
      getConversionFormula("USD", `(M${newRow}-N${newRow})`), // R: Flujo USD
      getConversionFormula("PYG", `(M${newRow}-N${newRow})`), // S: Flujo PYG
      getConversionFormula("EUR", `(M${newRow}-N${newRow})`), // T: Flujo EUR
      price > 0 ? `=((M${newRow}-N${newRow})*12)/G${newRow}` : "0" // U: Rentabilidad
    ];
    
    sheet.appendRow(rowData);
    sheet.getRange(newRow, 21).setNumberFormat("0.00%");
    
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
  if (sheet.getIndex() !== 1) return;
  if (e.range.getRow() === 1) return;
  e.range.setBackground("#fff2cc");
}
