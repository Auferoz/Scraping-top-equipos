const puppeteer = require('puppeteer');

/**
 * Formatea la fecha al formato YYYY-MM-DD
 * @returns {string} - Fecha formateada (con comilla simple para forzar texto)
 */
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  // Agregar comilla simple al inicio para que Google Sheets lo interprete como texto
  return `'${year}-${month}-${day}`;
}

/**
 * Función para hacer scraping de una página individual de equipo
 * @param {string} url - URL a scrapear
 * @param {string} compania - Nombre de la compañía (entel, wom, etc.)
 * @returns {Promise<Object>} - Datos extraídos del equipo
 */
async function scrapePage(url, compania = 'entel') {
  let browser;
  try {
    console.log(`Scrapeando: ${url}`);

    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Configurar viewport y user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navegar a la página
    console.log('Cargando página del equipo...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Esperar a que cargue el contenido principal según la compañía
    console.log('Esperando contenido del equipo...');

    if (compania.toLowerCase() === 'entel') {
      await page.waitForSelector('.pdp__header__brand, .equipment-title', { timeout: 30000 });
    } else if (compania.toLowerCase() === 'wom') {
      await page.waitForSelector('.select-details-module--productName--3TCGY, h1', { timeout: 30000 });
    }

    // Esperar un poco más para asegurar que todo cargó
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer datos usando evaluación en el navegador según la compañía
    const equipoData = await page.evaluate((companiaLower) => {
      // Función auxiliar para extraer texto de forma segura
      const getText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : 'N/A';
      };

      let marcaEquipo, modelo, capacityEquipo, precioOferta, descuentoEquipo;
      let numeroCuota = 'N/A';
      let precioCuota = 'N/A';
      let numeroCuotaNormal = 'N/A';
      let precioCuotaNormal = 'N/A';
      let precioNormal = 'N/A';

      if (companiaLower === 'entel') {
        // ========== SELECTORES PARA ENTEL ==========

        // Extraer marca
        marcaEquipo = getText('.pdp__header__brand');

        // Extraer modelo
        modelo = getText('h1.equipment-title.pdp__header__main-title');

        // Extraer capacidad
        capacityEquipo = getText('.pdp__header__capacity');

        // Extraer precio oferta (primer precio con clase selected)
        const precioOfertaElement = document.querySelector('.pdp__purchase-option__body--prices.selected');
        precioOferta = precioOfertaElement ? precioOfertaElement.textContent.trim() : 'N/A';

        // Extraer descuento
        descuentoEquipo = getText('.pdp__purchase-option__body--badge__discount');

        // Extraer información de cuotas (primer bloque de cuotas)
        const cuotasElements = document.querySelectorAll('.pdp__purchase-option__body--coutes__text');

        // Primera cuota (oferta)
        if (cuotasElements[0]) {
          const cuotasText = cuotasElements[0].textContent;
          const numeroCuotaMatch = cuotasText.match(/(\d+)\s*cuotas/i);
          if (numeroCuotaMatch) {
            numeroCuota = numeroCuotaMatch[1];
          }
          const precioCuotaMatch = cuotasText.match(/\$([0-9.,]+)\/mes/);
          if (precioCuotaMatch) {
            precioCuota = '$' + precioCuotaMatch[1] + '/mes';
          }
        }

        // Extraer precio normal (segundo precio sin selected)
        const allPrices = document.querySelectorAll('.pdp__purchase-option__body--prices.pdp__purchase-option__body--prices__price');

        // Buscar el precio que NO tenga la clase selected
        for (let i = 0; i < allPrices.length; i++) {
          if (!allPrices[i].classList.contains('selected')) {
            precioNormal = allPrices[i].textContent.trim();
            break;
          }
        }

        // Segunda cuota (normal)
        if (cuotasElements[1]) {
          const cuotasNormalText = cuotasElements[1].textContent;
          const numeroCuotaNormalMatch = cuotasNormalText.match(/(\d+)\s*cuotas/i);
          if (numeroCuotaNormalMatch) {
            numeroCuotaNormal = numeroCuotaNormalMatch[1];
          }
          const precioCuotaNormalMatch = cuotasNormalText.match(/\$([0-9.,]+)\/mes/);
          if (precioCuotaNormalMatch) {
            precioCuotaNormal = '$' + precioCuotaNormalMatch[1] + '/mes';
          }
        }

      } else if (companiaLower === 'wom') {
        // ========== SELECTORES PARA WOM ==========

        // Extraer marca - WOM no tiene selector específico para marca, usar N/A por ahora
        marcaEquipo = 'N/A';

        // Extraer modelo
        modelo = getText('h1.select-details-module--productName--3TCGY');

        // Extraer capacidad
        const capacidadElement = document.querySelector('h2.select-details-module--ram--1hMuO');
        if (capacidadElement) {
          const capacidadText = capacidadElement.textContent.trim();
          // Extraer solo la capacidad (ej: "256GB" de "Almacenamiento 256GB")
          const capacidadMatch = capacidadText.match(/(\d+\s*GB)/i);
          capacityEquipo = capacidadMatch ? capacidadMatch[1] : capacidadText;
        } else {
          capacityEquipo = 'N/A';
        }

        // Extraer precio oferta
        const precioOfertaElement = document.querySelector('.select-details-module--price--AntS5 .select-details-module--value--1lDtu');
        if (precioOfertaElement) {
          precioOferta = precioOfertaElement.textContent.trim();
        } else {
          precioOferta = 'N/A';
        }

        // Extraer descuento
        const descuentoElement = document.querySelector('.index-module--Offer__Discount__New--2k4R2');
        if (descuentoElement) {
          descuentoEquipo = descuentoElement.textContent.trim();
        } else {
          descuentoEquipo = 'N/A';
        }

        // Extraer número de cuotas
        const cuotasElement = document.querySelector('.select-details-module--installments--3OcDH');
        if (cuotasElement) {
          const cuotasText = cuotasElement.textContent.trim();
          // Extraer número de cuotas (ej: "24" de "Elígelo hasta en 24 cuotas sin interés")
          const numeroCuotaMatch = cuotasText.match(/(\d+)\s*cuotas/i);
          if (numeroCuotaMatch) {
            numeroCuota = numeroCuotaMatch[1];
          }
        }

        // Por ahora dejamos el resto como N/A hasta que me indiques de dónde sacarlos
        precioCuota = 'N/A';
        precioNormal = 'N/A';
        numeroCuotaNormal = 'N/A';
        precioCuotaNormal = 'N/A';
      }

      return {
        marcaEquipo,
        modelo,
        capacityEquipo,
        precioOferta,
        descuentoEquipo,
        numeroCuota,
        precioCuota,
        precioNormal,
        numeroCuotaNormal,
        precioCuotaNormal
      };
    }, compania.toLowerCase());

    // Agregar metadata y compañía
    equipoData.compania = compania.charAt(0).toUpperCase() + compania.slice(1); // Capitalizar primera letra
    equipoData.url = url;
    equipoData.fechaScraping = getFormattedDate();

    await browser.close();

    console.log(`✓ Scraping completado para: ${url}`);
    console.log(`  Equipo: ${equipoData.marcaEquipo} ${equipoData.modelo}`);

    return equipoData;

  } catch (error) {
    console.error(`✗ Error scrapeando ${url}:`, error.message);
    if (browser) {
      await browser.close();
    }
    return {
      compania: compania.charAt(0).toUpperCase() + compania.slice(1),
      error: error.message,
      url: url,
      fechaScraping: getFormattedDate()
    };
  }
}

/**
 * Función para scrapear múltiples URLs
 * @param {Array<{compania: string, url: string}>} urls - Array de objetos con compañía y URL
 * @returns {Promise<Object[]>} - Array con todos los datos extraídos
 */
async function scrapeMultiplePages(urls) {
  const results = [];

  for (const item of urls) {
    const { compania, url } = item;
    const equipoData = await scrapePage(url, compania);

    // Agregar el equipo al array de resultados
    results.push(equipoData);

    // Delay entre peticiones para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

module.exports = {
  scrapePage,
  scrapeMultiplePages
};
