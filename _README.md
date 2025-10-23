# Scraping Top Equipos

Proyecto de web scraping que extrae datos de URLs configuradas y los guarda automáticamente en Google Sheets mediante SheetDB.

## Estructura del Proyecto

- `urls.js` - Archivo donde se configuran las URLs a scrapear
- `scraper.js` - Lógica de scraping con Cheerio
- `sheetdb.js` - Integración con SheetDB para guardar datos
- `index.js` - Archivo principal que coordina todo el proceso

## Instalación

1. Instalar dependencias:
```bash
npm install
```

## Configuración

### 1. Configurar URLs

Edita el archivo [urls.js](urls.js) y agrega las URLs que deseas scrapear:

```javascript
const urls = [
  'https://tu-sitio-web.com/pagina1',
  'https://tu-sitio-web.com/pagina2',
  // Agrega más URLs aquí
];
```

### 2. Personalizar el Scraper

Edita el archivo [scraper.js](scraper.js) en la función `scrapePage()` para ajustar los selectores CSS según la estructura de las páginas que vas a scrapear:

```javascript
const data = {
  url: url,
  titulo: $('h1').first().text().trim(),
  precio: $('.precio').text().trim(),
  // Agrega más campos según necesites
};
```

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

1. Lee las URLs del archivo `urls.js`
2. Hace scraping de cada URL (con delay de 1 segundo entre peticiones)
3. Extrae los datos según los selectores configurados
4. Guarda todos los resultados en la hoja "Equipos" de tu spreadsheet via SheetDB

## Funciones Disponibles

### sheetdb.js

- `saveToSheet(data)` - Guarda un registro
- `saveMultipleToSheet(dataArray)` - Guarda múltiples registros
- `getAllData()` - Obtiene todos los datos de la hoja
- `clearSheet()` - Elimina todos los datos (usar con precaución)

## Dependencias

- `axios` - Para hacer peticiones HTTP
- `cheerio` - Para parsear y extraer datos del HTML

## Notas

- El scraper incluye un delay de 1 segundo entre peticiones para no sobrecargar los servidores
- Los errores se capturan y registran en consola
- Cada registro incluye la fecha de scraping automáticamente
