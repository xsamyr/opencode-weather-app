## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
```

## Inicializar proyecto

```bash
bun init
```

## Releases

El workflow `.github/workflows/release.yml` publica un release cuando cambia la versión en `package.json` en `main`, o al ejecutarlo manualmente desde Actions.

1. Actualiza `version` en `package.json` (por ejemplo `1.0.0`).
2. Haz push a `main`.
3. Se crea el tag `v1.0.0` y un release con los binarios:
   - `weather-windows-x64.exe`
   - `weather-linux-x64`
   - `weather-macos-arm64`

En Linux y macOS recuerda dar permisos de ejecución: `chmod +x weather-linux-x64`.

### Ejemplo del menú
Esta es la apariencia que deseamos crear

```bash
════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5
```