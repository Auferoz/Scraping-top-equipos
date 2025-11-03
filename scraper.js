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
 * Función auxiliar para obtener la capacidad de un equipo individual de Entel
 * @param {Object} page - Página de Puppeteer
 * @param {string} equipoUrl - URL relativa del equipo
 * @returns {Promise<string>} - Capacidad del equipo o 'N/A'
 */
async function getEntelCapacity(page, equipoUrl) {
  try {
    const fullUrl = `https://miportal.entel.cl${equipoUrl}`;
    console.log(`  → Obteniendo capacidad de: ${equipoUrl}`);

    await page.goto(fullUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Esperar a que cargue cualquiera de los dos posibles selectores
    await Promise.race([
      page.waitForSelector('.pdp__header__capacity', { timeout: 10000 }),
      page.waitForSelector('.pdp__variant-selection__capacity--label', { timeout: 10000 })
    ]).catch(() => {
      // Si ambos fallan, continuamos de todos modos
    });

    const capacity = await page.evaluate(() => {
      // Intentar con el primer selector
      let capacityElement = document.querySelector('.pdp__header__capacity');
      if (capacityElement) {
        return capacityElement.textContent.trim();
      }

      // Intentar con el selector alternativo (botón seleccionado)
      capacityElement = document.querySelector('.pdp__variant-selection__capacity--label');
      if (capacityElement) {
        return capacityElement.textContent.trim();
      }

      return 'N/A';
    });

    return capacity;
  } catch (error) {
    console.log(`  ✗ Error obteniendo capacidad: ${error.message}`);
    return 'N/A';
  }
}

/**
 * Función para hacer scraping de una página de listado de equipos
 * @param {string} url - URL del catálogo a scrapear
 * @param {string} compania - Nombre de la compañía (entel, wom, etc.)
 * @returns {Promise<Object[]>} - Array de datos extraídos de todos los equipos
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
    console.log('Cargando página del catálogo...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Esperar a que cargue el contenido principal según la compañía
    console.log('Esperando listado de equipos...');

    if (compania.toLowerCase() === 'entel') {
      await page.waitForSelector('.product-col', { timeout: 30000 });
    } else if (compania.toLowerCase() === 'wom') {
      await page.waitForSelector('.Product-module--container--BMAkS', { timeout: 30000 });
    } else if (compania.toLowerCase() === 'movistar') {
      await page.waitForSelector('li.item.product.product-item', { timeout: 30000 });
    } else if (compania.toLowerCase() === 'claro') {
      await page.waitForSelector('li.ui-block-a', { timeout: 30000 });
    }

    // Esperar un poco más para asegurar que todo cargó
    await new Promise(resolve => setTimeout(resolve, 3000));

    let equiposData = [];

    if (compania.toLowerCase() === 'entel') {
      // ========== ENTEL: Scraping de dos niveles ==========

      // Nivel 1: Extraer datos básicos del listado
      const equiposBasicos = await page.evaluate(() => {
        const getText = (element, selector) => {
          if (!element) return 'N/A';
          const el = element.querySelector(selector);
          return el ? el.textContent.trim() : 'N/A';
        };

        const equipos = [];
        const equipoCards = document.querySelectorAll('.product-col');

        equipoCards.forEach(card => {
          const linkElement = card.querySelector('a[href*="/personas/celulares/"]');
          const equipoUrl = linkElement ? linkElement.getAttribute('href') : 'N/A';
          const marcaEquipo = getText(card, 'p.info-marca');
          const modelo = getText(card, 'p.info-equipo');

          const precioOfertaElement = card.querySelector('b.info-precio');
          const precioOferta = precioOfertaElement ? precioOfertaElement.textContent.trim() : 'N/A';

          const precioNormalElements = card.querySelectorAll('s.price');
          const precioNormal = precioNormalElements.length > 0 ? precioNormalElements[0].textContent.trim() : 'N/A';

          // Extraer descuento - buscar el div con texto que contenga "% dcto."
          // Puede tener diferentes colores de fondo: verde agua (160, 243, 217) o naranja (255, 158, 128)
          let descuentoEquipo = 'N/A';
          const allDivsInCard = card.querySelectorAll('div[style*="background"]');
          for (let div of allDivsInCard) {
            const texto = div.textContent.trim();
            // Buscar divs que contengan porcentaje de descuento
            if ((texto.includes('dcto.') || texto.includes('%')) && texto.match(/\d+\s*%/)) {
              descuentoEquipo = texto;
              break;
            }
          }

          let numeroCuota = 'N/A';
          let precioCuota = 'N/A';
          const cuotasElement = card.querySelector('.info-subprecio.cuotas');
          if (cuotasElement) {
            const cuotasText = cuotasElement.textContent;
            const numeroCuotaMatch = cuotasText.match(/(\d+)\s*cuotas/i);
            if (numeroCuotaMatch) numeroCuota = numeroCuotaMatch[1];
            const precioCuotaMatch = cuotasText.match(/\$([0-9.,]+)/);
            if (precioCuotaMatch) precioCuota = '$' + precioCuotaMatch[1];
          }

          equipos.push({
            marcaEquipo,
            modelo,
            precioOferta,
            descuentoEquipo,
            numeroCuota,
            precioCuota,
            precioNormal,
            numeroCuotaNormal: 'N/A',
            precioCuotaNormal: 'N/A',
            equipoUrl
          });
        });

        return equipos;
      });

      console.log(`  ${equiposBasicos.length} equipos encontrados en el listado`);

      // Nivel 2: Por cada equipo, obtener la capacidad visitando su página individual
      for (let i = 0; i < equiposBasicos.length; i++) {
        const equipo = equiposBasicos[i];

        if (equipo.equipoUrl !== 'N/A') {
          // Obtener la capacidad visitando la página del equipo
          const capacity = await getEntelCapacity(page, equipo.equipoUrl);
          equipo.capacityEquipo = capacity;

          // Pequeño delay entre equipos
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          equipo.capacityEquipo = 'N/A';
        }

        equiposData.push(equipo);
      }

    } else if (compania.toLowerCase() === 'wom') {
      // ========== WOM: Scraping de un nivel (como antes) ==========

      equiposData = await page.evaluate(() => {
        // Función auxiliar para extraer texto de forma segura
        const getText = (element, selector) => {
          if (!element) return 'N/A';
          const el = element.querySelector(selector);
          return el ? el.textContent.trim() : 'N/A';
        };

        const equipos = [];

        // Obtener todos los contenedores de equipos
        const equipoCards = document.querySelectorAll('.Product-module--container--BMAkS');

        equipoCards.forEach(card => {
          // URL del equipo - necesitaríamos el link completo
          const equipoUrl = 'N/A'; // WOM no muestra el link directamente en el contenedor

          // Extraer marca
          const marcaEquipo = getText(card, 'strong.PhoneTitle-module--Title__Brand--4H8uF');

          // Extraer modelo
          const modelo = getText(card, 'strong.PhoneTitle-module--Title__Model--3om16');

          // Extraer capacidad del modelo (viene en el nombre)
          let capacityEquipo = 'N/A';
          if (modelo.includes('256GB')) {
            capacityEquipo = '256 GB';
          } else if (modelo.includes('128GB')) {
            capacityEquipo = '128 GB';
          } else if (modelo.includes('512GB')) {
            capacityEquipo = '512 GB';
          }

          // Extraer precio oferta
          const precioOferta = getText(card, 'span.PhonePrice-module--Pricing__Price--1hJ1C');

          // Extraer precio normal (tachado)
          let precioNormal = 'N/A';
          const precioNormalElement = card.querySelector('p.PhonePrice-module--Pricing__Offer--PFWNc s');
          if (precioNormalElement) {
            precioNormal = precioNormalElement.textContent.trim();
          }

          // Extraer descuento
          const descuentoEquipo = getText(card, 'strong.PhoneOffer-module--Offer__Discount--3_2Z9');

          // Extraer información de cuotas
          let numeroCuota = 'N/A';
          let precioCuota = 'N/A';
          const cuotasElement = card.querySelector('p.PhonePrice-module--Pricing__Paragraph--3Aun-');
          if (cuotasElement) {
            const cuotasText = cuotasElement.textContent;
            // Extraer número de cuotas (ej: "24" de "Hasta en 24 cuotas")
            const numeroCuotaMatch = cuotasText.match(/(\d+)\s*cuotas/i);
            if (numeroCuotaMatch) {
              numeroCuota = numeroCuotaMatch[1];
            }
            // Extraer precio de cuota (ej: "$7.500")
            const precioCuotaMatch = cuotasText.match(/\$([0-9.,]+)/);
            if (precioCuotaMatch) {
              precioCuota = '$' + precioCuotaMatch[1];
            }
          }

          // Cuotas normales - no disponibles en listado
          const numeroCuotaNormal = 'N/A';
          const precioCuotaNormal = 'N/A';

          equipos.push({
            marcaEquipo,
            modelo,
            capacityEquipo,
            precioOferta,
            descuentoEquipo,
            numeroCuota,
            precioCuota,
            precioNormal,
            numeroCuotaNormal,
            precioCuotaNormal,
            equipoUrl
          });
        });

        return equipos;
      });

    } else if (compania.toLowerCase() === 'movistar') {
      // ========== MOVISTAR: Scraping de un nivel ==========

      equiposData = await page.evaluate(() => {
        // Función auxiliar para extraer texto de forma segura
        const getText = (element, selector) => {
          if (!element) return 'N/A';
          const el = element.querySelector(selector);
          return el ? el.textContent.trim() : 'N/A';
        };

        const equipos = [];

        // Obtener todos los contenedores de equipos
        const equipoCards = document.querySelectorAll('li.item.product.product-item');

        equipoCards.forEach(card => {
          // Extraer URL del equipo
          const linkElement = card.querySelector('a.product-item-link');
          const equipoUrl = linkElement ? linkElement.getAttribute('href') : 'N/A';

          // Extraer el nombre completo del equipo (incluye marca y modelo)
          const nombreCompleto = getText(card, 'h2');

          // Intentar separar marca y modelo del nombre completo
          // Ej: "Samsung Galaxy S24 5G 128GB Negro Mate"
          let marcaEquipo = 'N/A';
          let modelo = nombreCompleto;

          if (nombreCompleto !== 'N/A') {
            const palabras = nombreCompleto.split(' ');
            if (palabras.length > 0) {
              marcaEquipo = palabras[0]; // Primera palabra es la marca
              modelo = nombreCompleto; // Modelo completo incluye todo
            }
          }

          // Extraer capacidad del nombre (ej: "128GB", "256GB")
          let capacityEquipo = 'N/A';
          const capacityMatch = nombreCompleto.match(/(\d+\s*GB)/i);
          if (capacityMatch) {
            capacityEquipo = capacityMatch[1].replace(/\s/g, ' '); // Normalizar espacios
          }

          // Extraer precio oferta
          const precioOferta = getText(card, 'span.divCon-plan-txt-valor-sinLabel');

          // Extraer precio normal (tachado)
          const precioNormal = getText(card, 'span.old-price span.price');

          // Extraer descuento
          let descuentoEquipo = getText(card, 'span.divSin-plan-txt-dcto');

          // Extraer información de cuotas
          let numeroCuota = 'N/A';
          let precioCuota = 'N/A';
          const cuotasElement = card.querySelector('div.monthly-price');
          if (cuotasElement) {
            const cuotasText = cuotasElement.textContent;
            // Ej: "en 24 x $19.583 sin interés*"
            const numeroCuotaMatch = cuotasText.match(/(\d+)\s*x/i);
            if (numeroCuotaMatch) {
              numeroCuota = numeroCuotaMatch[1];
            }
            const precioCuotaMatch = cuotasText.match(/\$([0-9.,]+)/);
            if (precioCuotaMatch) {
              precioCuota = '$' + precioCuotaMatch[1];
            }
          }

          // Cuotas normales - no disponibles en listado
          const numeroCuotaNormal = 'N/A';
          const precioCuotaNormal = 'N/A';

          equipos.push({
            marcaEquipo,
            modelo,
            capacityEquipo,
            precioOferta,
            descuentoEquipo,
            numeroCuota,
            precioCuota,
            precioNormal,
            numeroCuotaNormal,
            precioCuotaNormal,
            equipoUrl
          });
        });

        return equipos;
      });

    } else if (compania.toLowerCase() === 'claro') {
      // ========== CLARO: Scraping de un nivel ==========

      equiposData = await page.evaluate(() => {
        // Función auxiliar para extraer texto de forma segura
        const getText = (element, selector) => {
          if (!element) return 'N/A';
          const el = element.querySelector(selector);
          return el ? el.textContent.trim() : 'N/A';
        };

        const equipos = [];

        // Obtener todos los contenedores de equipos
        const equipoCards = document.querySelectorAll('li.ui-block-a');

        equipoCards.forEach(card => {
          // Verificar que tenga la estructura de producto
          const productDiv = card.querySelector('div.product');
          if (!productDiv) return;

          // Extraer URL del equipo
          const linkElement = card.querySelector('a#catalogEntry_img');
          const equipoUrl = linkElement ? linkElement.getAttribute('href') : 'N/A';

          // Extraer el nombre completo del equipo (incluye marca y modelo)
          const nombreCompleto = getText(card, 'a.title-product');

          // Intentar separar marca y modelo del nombre completo
          // Ej: "iPhone 16 5G 128GB Rosado"
          let marcaEquipo = 'N/A';
          let modelo = nombreCompleto;

          if (nombreCompleto !== 'N/A') {
            const palabras = nombreCompleto.split(' ');
            if (palabras.length > 0) {
              // Para iPhone/iPad/etc, la marca es la primera palabra
              if (palabras[0].toLowerCase().includes('iphone') || palabras[0].toLowerCase().includes('ipad')) {
                marcaEquipo = 'Apple';
              } else {
                marcaEquipo = palabras[0]; // Primera palabra es la marca
              }
              modelo = nombreCompleto; // Modelo completo incluye todo
            }
          }

          // Extraer capacidad desde span.storage (ej: "128GB / 5G")
          let capacityEquipo = 'N/A';
          const storageText = getText(card, 'span.storage');
          if (storageText !== 'N/A') {
            const capacityMatch = storageText.match(/(\d+\s*GB)/i);
            if (capacityMatch) {
              capacityEquipo = capacityMatch[1].replace(/(\d+)GB/, '$1 GB'); // Normalizar con espacio
            }
          }

          // Extraer precio oferta (span con id que empieza con offerPrice_)
          let precioOferta = 'N/A';
          const precioOfertaElement = card.querySelector('span[id^="offerPrice_"].price');
          if (precioOfertaElement) {
            precioOferta = precioOfertaElement.textContent.trim();
          }

          // Extraer precio normal (dentro de .old_price)
          let precioNormal = 'N/A';
          const precioNormalElement = card.querySelector('.old_price span.new-price');
          if (precioNormalElement) {
            precioNormal = precioNormalElement.textContent.trim();
          }

          // Extraer descuento (ej: "23%")
          let descuentoEquipo = getText(card, '.discount-product');
          if (descuentoEquipo !== 'N/A' && !descuentoEquipo.includes('%')) {
            descuentoEquipo = descuentoEquipo + '%';
          }

          // Claro no muestra información de cuotas en el listado
          const numeroCuota = 'N/A';
          const precioCuota = 'N/A';
          const numeroCuotaNormal = 'N/A';
          const precioCuotaNormal = 'N/A';

          equipos.push({
            marcaEquipo,
            modelo,
            capacityEquipo,
            precioOferta,
            descuentoEquipo,
            numeroCuota,
            precioCuota,
            precioNormal,
            numeroCuotaNormal,
            precioCuotaNormal,
            equipoUrl
          });
        });

        return equipos;
      });
    }

    await browser.close();

    console.log(`✓ Scraping completado para: ${url}`);
    console.log(`  ${equiposData.length} equipos encontrados`);

    // Agregar metadata a cada equipo
    const equiposConMetadata = equiposData.map(equipo => {
      let finalUrl = url;
      if (equipo.equipoUrl !== 'N/A') {
        if (compania.toLowerCase() === 'entel') {
          finalUrl = `https://miportal.entel.cl${equipo.equipoUrl}`;
        } else if (compania.toLowerCase() === 'wom') {
          // WOM no proporciona URL individual en el listado
          finalUrl = url;
        } else if (compania.toLowerCase() === 'movistar') {
          // Movistar ya tiene la URL completa
          finalUrl = equipo.equipoUrl;
        } else if (compania.toLowerCase() === 'claro') {
          // Claro proporciona URL relativa, construir URL completa
          if (equipo.equipoUrl.startsWith('http')) {
            finalUrl = equipo.equipoUrl;
          } else {
            finalUrl = `https://www.clarochile.cl${equipo.equipoUrl}`;
          }
        }
      }

      return {
        compania: compania.charAt(0).toUpperCase() + compania.slice(1),
        ...equipo,
        url: finalUrl,
        fechaScraping: getFormattedDate()
      };
    });

    // Eliminar el campo temporal equipoUrl
    equiposConMetadata.forEach(equipo => {
      delete equipo.equipoUrl;
    });

    return equiposConMetadata;

  } catch (error) {
    console.error(`✗ Error scrapeando ${url}:`, error.message);
    if (browser) {
      await browser.close();
    }
    return [{
      compania: compania.charAt(0).toUpperCase() + compania.slice(1),
      marcaEquipo: 'ERROR',
      modelo: error.message,
      capacityEquipo: 'N/A',
      precioOferta: 'N/A',
      descuentoEquipo: 'N/A',
      numeroCuota: 'N/A',
      precioCuota: 'N/A',
      precioNormal: 'N/A',
      numeroCuotaNormal: 'N/A',
      precioCuotaNormal: 'N/A',
      url: url,
      fechaScraping: getFormattedDate()
    }];
  }
}

/**
 * Función para scrapear múltiples URLs de catálogos
 * @param {Array<{compania: string, url: string}>} urls - Array de objetos con compañía y URL
 * @returns {Promise<Object[]>} - Array con todos los datos extraídos de todos los equipos
 */
async function scrapeMultiplePages(urls) {
  const results = [];

  for (const item of urls) {
    const { compania, url } = item;
    const equiposData = await scrapePage(url, compania);

    // equiposData es un array de equipos, así que lo concatenamos
    results.push(...equiposData);

    // Delay entre peticiones para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

module.exports = {
  scrapePage,
  scrapeMultiplePages
};
