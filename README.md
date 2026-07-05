# 📊 Sistema de Control e Incidencias de Personal

Este es un sistema automatizado para el procesamiento de asistencia, guardado en base de datos e inyección de estilos personalizados para la previsualización y exportación de incidencias de personal. Diseñado específicamente para optimizar la gestión de nómina y cálculos de personal en distintas sucursales.

---

## 🚀 Características Principales

*   **Carga Dinámica de Archivos Excel**: Procesa archivos de asistencia mensual consolidada, detectando automáticamente la estructura de filas y cabeceras (incluso variaciones donde las fechas están en la Fila 1).
*   **Cálculo en Vivo de Incidencias**:
    *   **Bono Nocturno**: Calcula de forma automática según las reglas de cada sucursal (ej: el estatus `"Asistió especial"` vale **3** en todas las sucursales; en *Bodegón Costazul*, los estatus `"Presente a tiempo"` y `"Presente cierre a tiempo"` computan **2**).
    *   **Domingos y Feriados**: Computa automáticamente los domingos y los días declarados como feriados por el usuario, aplicando reglas de horas extras, redobles y asistencia.
    *   **Ausencias**: Clasifica y registra ausencias justificadas e injustificadas.
*   **Gestión de Días Feriados**: Permite ingresar y registrar feriados de forma manual con validación del mes, quincena y año en proceso para evitar errores humanos.
*   **Previsualización Interactiva**: Filtra y busca colaboradores por su código, nombre, cargo o tipo de incidencia en tiempo real sobre una interfaz moderna.
*   **Historial Local Seguro**: Guarda los cortes procesados en una base de datos local SQLite, permitiendo cargarlos, consultarlos o eliminarlos en cualquier momento.
*   **Exportación de Excel con Estilos Premium**: Genera archivos Excel listos para la descarga (`.xlsx`), coloreando los encabezados y celdas según la sucursal del empleado para una fácil lectura administrativa:
    *   🟡 **Happy Shack / Happy Shack II**: Amarillo (`#FFE699` / `#FFF2CC`)
    *   🟢 **Bodegón Costazul**: Verde (`#C6E0B4` / `#E2EFDA`)
    *   🔵 **Supermarket Costazul**: Azul (`#B4C6E7` / `#DDEBF7`)
*   **Restricción de Acceso de Seguridad**: Capa de autenticación de usuario y clave maestra para proteger el sistema ante accesos no autorizados en la red local.

---

## 🔒 Credenciales de Acceso por Defecto

Para usar el sistema, se requieren las siguientes credenciales maestras:

*   **Usuario**: `Daridev`
*   **Contraseña**: `Draca29*`

---

## ⚙️ Tecnologías Utilizadas

*   **Frontend**: React, Vite, CSS Vanilla (Ajuste a pantalla completa sin scroll).
*   **Backend**: Node.js, Express.js.
*   **Base de Datos**: SQLite3 para el almacenamiento persistente local.
*   **Procesamiento de Archivos**: `xlsx-js-style` para lectura de datos y generación de reportes con estilos visuales.

---

## 📋 Requisitos Previos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior recomendada) en tu sistema.

---

## 🚀 Instalación y Uso

1.  **Instalar dependencias**:
    Abre una terminal en el directorio del proyecto y ejecuta:
    ```bash
    npm install
    ```

2.  **Iniciar Servidor de Producción y API**:
    Arranca el servidor backend (Node + Express) en el puerto `5000`:
    ```bash
    npm run start
    ```
    El sistema estará disponible en tu red local y navegador en:
    `http://localhost:5000`

3.  **Compilar para Producción**:
    Si realizas cambios en el código del frontend y deseas regenerar el compilado de producción:
    ```bash
    npm run build
    ```

4.  **Ejecutar Pruebas Automatizadas de Cálculo**:
    Puedes ejecutar el verificador de cálculos mockeado para verificar que todas las reglas de negocio e incidencias se estén calculando correctamente:
    ```bash
    node test_runner.js
    ```
