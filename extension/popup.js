document.addEventListener('DOMContentLoaded', () => {
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxflmdnzEpwK7KmQJdHaMByLZFAsQmJYfxerFpEVeoGOPWyDdKKJK5-WOSDfc7b8fUkZw/exec";
  
  const operacionSelect = document.getElementById('operacion');
  const seccionFinanciera = document.getElementById('seccion-financiera');
  const alquilerInput = document.getElementById('alquiler');
  
  // Ocultar sección financiera si es alquiler
  operacionSelect.addEventListener('change', () => {
    if (operacionSelect.value === 'alquiler') {
      seccionFinanciera.style.display = 'none';
    } else {
      seccionFinanciera.style.display = 'block';
    }
  });

  // Execute content.js in active tab to extract data
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ['content.js']
    }, (results) => {
      if (results && results[0] && results[0].result) {
        let data = results[0].result;
        
        if (data.operacion) {
          operacionSelect.value = data.operacion;
          operacionSelect.dispatchEvent(new Event('change'));
        }
        
        if (data.title) document.getElementById('titulo').value = data.title;
        if (data.ubicacion) document.getElementById('ubicacion').value = data.ubicacion;
        if (data.price) document.getElementById('precio').value = data.price;
        if (data.currency) document.getElementById('moneda').value = data.currency;
        if (data.m2) document.getElementById('superficie').value = data.m2;
        if (data.dormitorios) document.getElementById('dormitorios').value = data.dormitorios;
        if (data.banos) document.getElementById('banos').value = data.banos;
        if (data.garajes) document.getElementById('garajes').value = data.garajes;
        if (data.piscina) document.getElementById('piscina').value = data.piscina;
        if (data.amoblado) document.getElementById('amoblado').value = data.amoblado;
        
        // Petición AVM (Automated Valuation) si es venta
        if (operacionSelect.value === 'venta' && data.ubicacion) {
          document.getElementById('status').innerText = "Calculando alquiler estimado...";
          let urlParams = `?ubicacion=${encodeURIComponent(data.ubicacion)}&dormitorios=${data.dormitorios}&banos=${data.banos}&piscina=${data.piscina}&amoblado=${data.amoblado}&m2=${data.m2}`;
          
          fetch(WEB_APP_URL + urlParams)
            .then(res => res.json())
            .then(avmData => {
              if (avmData.status === "success" && avmData.average) {
                alquilerInput.value = Math.round(avmData.average);
                alquilerInput.style.color = "#0056b3"; // Color azul para indicar que es automático
                alquilerInput.style.fontWeight = "bold";
                document.getElementById('status').innerText = `¡Alquiler estimado cargado! (Basado en ${avmData.count} comparables)`;
              } else {
                document.getElementById('status').innerText = "Listo para guardar.";
              }
            })
            .catch(err => {
              document.getElementById('status').innerText = "Listo para guardar.";
            });
        } else {
           document.getElementById('status').innerText = "Listo para guardar.";
        }
      }
    });
  });
  
  // Save button
  document.getElementById('btn-guardar').addEventListener('click', () => {
    const btn = document.getElementById('btn-guardar');
    const status = document.getElementById('status');
    
    btn.disabled = true;
    status.innerText = "Enviando a Google Sheets...";
    status.style.color = "#555";
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      let activeTab = tabs[0];
      
      const payload = {
        operacion: document.getElementById('operacion').value,
        url: activeTab.url,
        titulo: document.getElementById('titulo').value,
        ubicacion: document.getElementById('ubicacion').value,
        precio: document.getElementById('precio').value,
        moneda: document.getElementById('moneda').value,
        superficie: document.getElementById('superficie').value,
        dormitorios: document.getElementById('dormitorios').value,
        banos: document.getElementById('banos').value,
        garajes: document.getElementById('garajes').value,
        piscina: document.getElementById('piscina').value,
        amoblado: document.getElementById('amoblado').value,
        alquiler: document.getElementById('alquiler').value,
        comunidad: document.getElementById('comunidad').value
      };
      
      fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          status.innerText = "¡Guardado con éxito! Fila " + data.row;
          status.style.color = "green";
        } else if (data.status === "duplicate") {
          status.innerText = "⚠️ Este inmueble ya estaba guardado antes.";
          status.style.color = "orange";
          btn.disabled = false;
        } else {
          status.innerText = "Error al guardar.";
          status.style.color = "red";
          btn.disabled = false;
        }
      })
      .catch(error => {
        status.innerText = "Error de red al guardar.";
        status.style.color = "red";
        btn.disabled = false;
      });
    });
  });
  
  alquilerInput.addEventListener('input', () => {
     alquilerInput.style.color = "black";
     alquilerInput.style.fontWeight = "normal";
  });
});
