# Especificación de Integración ERP - PAC

Este documento detalla la estructura de datos (Payload JSON) que el ERP genera y envía al Proveedor Autorizado de Certificación (PAC) para la emisión de facturas electrónicas.

## Información General

*   **Método de Envío**: REST API (POST)
*   **Formato de Datos**: JSON
*   **Codificación**: UTF-8
*   **Autenticación**: API Key / Licencia (según proveedor)

## Estructura del Payload (JSON)

El objeto JSON enviado consta de las siguientes secciones principales:

### 1. Cabecera del Documento (`documento`)

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `tipo` | String | Tipo de documento fiscal (01=Factura, 04=Nota de Crédito) | "01" |
| `puntoFacturacion` | String | Código del punto de venta emisor | "01" |
| `fechaEmision` | ISO8601 | Fecha y hora de emisión | "2024-01-20T10:30:00Z" |
| `numero` | String | Número consecutivo del documento interno | "F-2024-001" |

### 2. Emisor (`emisor`)

Datos de la empresa que emite la factura (configurados en el ERP).

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `ruc` | String | RUC del emisor | "1556987-1-4567" |
| `dv` | String | Dígito verificador | "55" |
| `razonSocial` | String | Nombre legal de la empresa | "Mi Empresa S.A." |
| `sucursal` | String | Código de la sucursal | "0000" |
| `direccion` | String | Dirección física del establecimiento | "Av. Balboa, Torre X..." |

### 3. Receptor (`receptor`)

Datos del cliente que recibe la factura.

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `ruc` | String | RUC o Identificación del receptor | "8-754-1234" |
| `razonSocial` | String | Nombre o Razón Social del receptor | "Cliente Ejemplo Inc." |
| `direccion` | String | Dirección del receptor | "Ciudad de Panamá" |
| `tipo` | String | Tipo de contribuyente (01=Contribuyente, 02=Consumidor Final, etc.) | "01" |

### 4. Items (`items`)

Lista de productos o servicios facturados.

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `descripcion` | String | Descripción del bien o servicio | "Servicio de Consultoría" |
| `cantidad` | Number | Cantidad vendida | 1.00 |
| `precioUnitario` | Number | Precio por unidad (antes de impuestos) | 150.00 |
| `total` | Number | Total de la línea (cantidad * precio) | 150.00 |
| `tasaItbms` | Number | Tasa de impuesto decimal (0.07 = 7%) | 0.07 |

### 5. Totales (`totales`)

Resumen de montos de la transacción.

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `subtotal` | Number | Suma de importes sujetos a impuesto | 150.00 |
| `itbms` | Number | Total de impuestos calculados | 10.50 |
| `total` | Number | Monto total a pagar (subtotal + impuestos) | 160.50 |
| `totalItems` | Integer | Cantidad de líneas en la factura | 1 |

---

## Tipos de Documentos y Ejemplos

### A. Factura de Venta (Tipo 01)

Documento estándar de venta.

```json
{
  "documento": {
    "tipo": "01",
    "puntoFacturacion": "01",
    "fechaEmision": "2024-05-21T14:00:00.000Z",
    "numero": "FAC-10023"
  },
  "emisor": {
    "ruc": "1234567-1-1234",
    "dv": "00",
    "razonSocial": "Empresa Demo S.A.",
    "sucursal": "0000",
    "direccion": "Vía España, Ciudad de Panamá"
  },
  "receptor": {
    "ruc": "8-123-456",
    "razonSocial": "Cliente Pruebas",
    "direccion": "Ciudad de Panamá",
    "tipo": "01"
  },
  "items": [
    {
      "descripcion": "Licencia Software Anual",
      "cantidad": 1,
      "precioUnitario": 500.00,
      "total": 500.00,
      "tasaItbms": 0.07
    }
  ],
  "totales": {
    "subtotal": 500.00,
    "itbms": 35.00,
    "total": 535.00,
    "totalItems": 1
  }
}
```

### B. Nota de Crédito (Tipo 04)

Documento para anulaciones o devoluciones. Requiere referencia a la factura original.

**Campos Adicionales:**
| Campo | Ubicación | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `invoiceNumber` | Raíz | CUFE de la factura afectada (Original) | "FE01-20000..." |
| `invoiceNumberRefDate` | Raíz | Fecha de emisión de la factura afectada | "2024-05-20" |

```json
{
  "documento": {
    "tipo": "04",
    "puntoFacturacion": "01",
    "fechaEmision": "2024-06-01T10:00:00.000Z",
    "numero": "NC-2024-005"
  },
  "invoiceNumber": "FE01-200000000000000000",
  "invoiceNumberRefDate": "2024-05-20",
  "emisor": {
    "ruc": "1234567-1-1234",
    "dv": "00",
    "razonSocial": "Empresa Demo S.A.",
    "sucursal": "0000",
    "direccion": "Vía España, Ciudad de Panamá"
  },
  "receptor": {
    "ruc": "8-123-456",
    "razonSocial": "Cliente Pruebas",
    "direccion": "Ciudad de Panamá",
    "tipo": "01"
  },
  "items": [
    {
      "descripcion": "DEVOLUCION: Licencia Software",
      "cantidad": 1,
      "precioUnitario": 500.00,
      "total": 500.00,
      "tasaItbms": 0.07
    }
  ],
  "totales": {
    "subtotal": 500.00,
    "itbms": 35.00,
    "total": 535.00,
    "totalItems": 1
  }
}
```
