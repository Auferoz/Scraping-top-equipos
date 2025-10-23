# Configuración de SheetDB

## Paso 1: Preparar tu Google Sheet

Antes de ejecutar el scraper, debes configurar tu hoja de Google Sheets con los encabezados correctos.

### En tu Google Sheet, crea una hoja llamada "Equipos"

En la **primera fila** de la hoja "Equipos", agrega estos encabezados en este orden exacto:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| compania | marcaEquipo | modelo | capacityEquipo | precioOferta | descuentoEquipo | numeroCuota | precioCuota | precioNormal | numeroCuotaNormal | precioCuotaNormal | url | fechaScraping |

### Nombres de columnas (copia y pega en la primera fila):

```
compania	marcaEquipo	modelo	capacityEquipo	precioOferta	descuentoEquipo	numeroCuota	precioCuota	precioNormal	numeroCuotaNormal	precioCuotaNormal	url	fechaScraping
```

## Paso 2: Conectar con SheetDB

1. Ve a [https://sheetdb.io/](https://sheetdb.io/)
2. Asegúrate de que tu spreadsheet esté conectado a la API: `https://sheetdb.io/api/v1/mv1wyv7au3gc0`
3. Verifica que la hoja "Equipos" exista y tenga los encabezados

## Descripción de las Columnas

- **compania**: Nombre de la compañía (siempre "Entel")
- **marcaEquipo**: Marca del equipo (ej: "Apple", "Samsung")
- **modelo**: Modelo del equipo (ej: "Galaxy S25 Ultra 5G", "iPhone 17 Pro")
- **capacityEquipo**: Capacidad de almacenamiento (ej: "256 GB", "128 GB")
- **precioOferta**: Precio en oferta/promoción (ej: "$1.159.990")
- **descuentoEquipo**: Porcentaje de descuento (ej: "21% dcto.")
- **numeroCuota**: Número de cuotas de la oferta (ej: "24")
- **precioCuota**: Precio mensual de cada cuota de la oferta (ej: "$48.333/mes")
- **precioNormal**: Precio normal sin descuento (ej: "$499.990")
- **numeroCuotaNormal**: Número de cuotas del precio normal (ej: "24")
- **precioCuotaNormal**: Precio mensual de cada cuota del precio normal (ej: "$20.833/mes")
- **url**: URL del equipo
- **fechaScraping**: Fecha del scraping en formato YYYY-MM-DD (ej: "2025-10-23")

## Ejemplo de datos que se guardarán:

| compania | marcaEquipo | modelo | capacityEquipo | precioOferta | descuentoEquipo | numeroCuota | precioCuota | precioNormal | numeroCuotaNormal | precioCuotaNormal | url | fechaScraping |
|----------|-------------|--------|----------------|--------------|-----------------|-------------|-------------|--------------|-------------------|-------------------|-----|---------------|
| Entel | Samsung | Galaxy S25 Ultra 5G | 256 GB | $1.159.990 | 21% dcto. | 24 | $48.333/mes | $499.990 | 24 | $20.833/mes | https://... | 2025-10-23 |
| Entel | Samsung | Galaxy A56 5G | 128 GB | $399.990 | 15% dcto. | 24 | $16.666/mes | $299.990 | 24 | $12.500/mes | https://... | 2025-10-23 |

Una vez configurado esto, el scraper podrá guardar los datos correctamente.
