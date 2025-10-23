const urls = require('./urls');
const { scrapeMultiplePages } = require('./scraper');
const { saveMultipleToSheet } = require('./sheetdb');

/**
 * Función principal que coordina el scraping y guardado
 */
async function main() {
  try {
    console.log('=== Iniciando proceso de scraping ===\n');

    // 1. Mostrar URLs a scrapear
    console.log(`URLs a procesar: ${urls.length}`);
    urls.forEach((item, index) => {
      console.log(`  ${index + 1}. [${item.compania.toUpperCase()}] ${item.url}`);
    });
    console.log('');

    // 2. Hacer scraping de todas las URLs
    console.log('--- Fase de Scraping ---');
    const scrapedData = await scrapeMultiplePages(urls);
    console.log(`\n✓ Scraping completado. ${scrapedData.length} registros obtenidos.\n`);

    // 3. Guardar datos en SheetDB
    console.log('--- Fase de Guardado ---');
    await saveMultipleToSheet(scrapedData);

    console.log('\n=== Proceso completado exitosamente ===');
    console.log(`Total de registros procesados: ${scrapedData.length}`);

  } catch (error) {
    console.error('\n✗ Error en el proceso:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
if (require.main === module) {
  main();
}

module.exports = main;
