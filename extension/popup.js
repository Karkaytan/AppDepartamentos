document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let activeTab = tabs[0];
    
    // Auto-fill from content script
    chrome.scripting.executeScript({
      target: {tabId: activeTab.id},
      files: ['content.js']
    }, (results) => {
      if (results && results[0] && results[0].result) {
        let data = results[0].result;
        
        if (data.title) document.getElementById('titulo').value = data.title;
        if (data.ubicacion) document.getElementById('ubicacion').value = data.ubicacion;
        if (data.price) document.getElementById('precio').value = data.price;
        if (data.currency) document.getElementById('moneda').value = data.currency;
        if (data.m2) document.getElementById('superficie').value = data.m2;
        if (data.dormitorios) document.getElementById('dormitorios').value = data.dormitorios;
        if (data.banos) document.getElementById('banos').value = data.banos;
        if (data.garajes) document.getElementById('garajes').value = data.garajes;
        if (data.piscina) document.getElementById('piscina').value = data.piscina;
      }
    });
  });
  
  // Save button
  document.getElementById('btn-guardar').addEventListener('click', () => {
    const btn = document.getElementById('btn-guardar');
    const status = document.getElementById('status');
    
    btn.disabled = true;
    status.innerText = "Enviando a Google Sheets...";
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      let activeTab = tabs[0];
      
      const payload = {
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
        alquiler: document.getElementById('alquiler').value,
        comunidad: document.getElementById('comunidad').value
      };
      
      const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzmqbnTp42nvAXYFXKTKnfdcogOLiiQPDBZtiiYJD5s4GWBxRZuKTFQt_Al73uBlcjkWQ/exec";
      
      fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          status.innerText = "¡Guardado con éxito! Fila " + data.row;
          status.style.color = "green";
        } else {
          status.innerText = "Error al guardar.";
          status.style.color = "red";
          btn.disabled = false;
        }
      })
      .catch(err => {
        status.innerText = "Error de conexión.";
        status.style.color = "red";
        btn.disabled = false;
      });
    });
  });
});
