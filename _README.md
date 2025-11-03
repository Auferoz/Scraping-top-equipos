# Scraping Top Equipos

Proyecto de web scraping que extrae datos de catálogos de equipos móviles de Entel y WOM, y los guarda automáticamente en Google Sheets mediante SheetDB.

## Estructura del Proyecto

- `urls.js` - Archivo donde se configuran las URLs de los catálogos a scrapear
- `scraper.js` - Lógica de scraping con Puppeteer (extrae todos los equipos de cada página de catálogo)
- `sheetdb.js` - Integración con SheetDB para guardar datos
- `index.js` - Archivo principal que coordina todo el proceso

## Instalación

1. Instalar dependencias:
```bash
npm install
```

## Configuración

### 1. Configurar URLs

Edita el archivo [urls.js](urls.js) y agrega las URLs de los catálogos que deseas scrapear:

```javascript
const urls = [
  { compania: 'entel', url: 'https://miportal.entel.cl/personas/catalogo/celulares/' },
  { compania: 'wom', url: 'https://store.wom.cl/equipos/' },
  // Agrega más URLs de catálogos aquí
];
```

**Nota:** El scraper ahora extrae **todos los equipos** que aparecen en cada página de catálogo.

### 2. Personalizar el Scraper

El scraper ya está configurado para:
- **Entel**: Extrae equipos de `.product-col` en páginas de catálogo
- **WOM**: Extrae equipos de `.Product-module--container--BMAkS` en páginas de listado

Si necesitas ajustar los selectores CSS, edita el archivo [scraper.js](scraper.js) en la función `scrapePage()`.

### 3. SheetDB

El proyecto está configurado para usar la API de SheetDB:
- API URL: `https://sheetdb.io/api/v1/mv1wyv7au3gc0`
- Hoja: `Equipos`

Si necesitas cambiar estos valores, edita [sheetdb.js](sheetdb.js).

## Uso

Para ejecutar el scraping:

```bash
npm start
```

O directamente:

```bash
node index.js
```

## Proceso

El script realiza las siguientes acciones:

1. Lee las URLs de catálogos del archivo `urls.js`
2. Para cada catálogo:
   - Navega a la página usando Puppeteer
   - Extrae **todos los equipos** que aparecen en el listado
   - Espera 2 segundos entre catálogos para no sobrecargar el servidor
3. Extrae los datos de cada equipo según los selectores configurados
4. Guarda todos los resultados en la hoja "Equipos" de tu spreadsheet via SheetDB

## Funciones Disponibles

### sheetdb.js

- `saveToSheet(data)` - Guarda un registro
- `saveMultipleToSheet(dataArray)` - Guarda múltiples registros
- `getAllData()` - Obtiene todos los datos de la hoja
- `clearSheet()` - Elimina todos los datos (usar con precaución)

## Dependencias

- `axios` - Para hacer peticiones HTTP a SheetDB
- `puppeteer` - Para navegar y extraer datos de páginas dinámicas

## Notas

- El scraper usa Puppeteer en modo headless para navegar las páginas
- Incluye un delay de 2 segundos entre catálogos para no sobrecargar los servidores
- Los errores se capturan y registran en consola
- Cada registro incluye la fecha de scraping automáticamente
- **IMPORTANTE**: Este scraper extrae todos los equipos de cada página de catálogo, no equipos individuales
