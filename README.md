# AnimeApp

App móvil para Android y iPhone (una sola base de código con Expo / React Native) para ver anime a través de tu propia instancia de [anime1v-api](https://github.com/FxxMorgan/anime1v-api).

- Catálogo con filtro por género y scroll infinito
- Búsqueda multi-proveedor
- Detalle con sinopsis, géneros y lista de episodios
- Reproductor nativo (HLS/MP4) con cambio de servidor, sub/dub y episodio anterior/siguiente; si no hay enlace directo, usa el embed en un WebView
- Favoritos guardados en el dispositivo
- Diseño responsive: el número de columnas y el reproductor se adaptan al ancho (móviles, plegables y tablets, vertical y horizontal)

## 1. Alojar la API

La app consume la API, así que esta debe estar accesible desde el teléfono.

La API ya viene incluida en la carpeta `server/` (copia de [anime1v-api](https://github.com/FxxMorgan/anime1v-api), licencia MIT) junto con un `Dockerfile` y un `render.yaml`.

1. En [render.com](https://render.com) inicia sesión con GitHub y elige **New → Blueprint**.
2. Selecciona este repositorio y pulsa **Apply**. Render construye y despliega el servidor solo.
3. Cuando termine, copia la URL que te da (algo como `https://anime-app-api.onrender.com`) y comprueba `/health`.

La clave y el límite diario están en `render.yaml` (`API_KEYS` y `DAILY_REQUEST_LIMIT`); cámbialos allí si quieres. El plan gratuito de Render duerme el servicio tras un rato sin uso, así que la primera petición puede tardar ~1 minuto.

## 2. Ejecutar la app

Requisitos: Node.js 18+ y la app Expo Go en tu móvil (o un emulador).

```bash
npm install
npx expo install --fix   # alinea las versiones con tu SDK de Expo
npx expo start
```

Escanea el QR con Expo Go. En la pestaña **Ajustes** escribe la URL de tu API y la API Key.

- Emulador de Android con la API en tu PC: `http://10.0.2.2:3000`
- Teléfono en tu red local: `http://IP-de-tu-PC:3000`

## 3. Generar el APK / IPA

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # genera un APK instalable
eas build -p ios                         # requiere cuenta de Apple Developer
```

Antes de publicar cambia `com.example.animeapp` por tu identificador en `app.json`. En producción usa una API con HTTPS y elimina los permisos de tráfico HTTP sin cifrar del plugin `expo-build-properties`.

## Estructura

```
App.tsx                      navegación (tabs + stack)
src/api/                     cliente y tipos de anime1v-api
src/state/                   ajustes y favoritos (AsyncStorage)
src/screens/                 Inicio, Búsqueda, Favoritos, Detalle, Reproductor, Ajustes
src/components/              rejilla responsive y estados de carga/error
```

## Créditos

El motor de scraping y la API son obra de [FxxMorgan](https://github.com/FxxMorgan/) (anime1v-api, licencia MIT). Esta app es solo un cliente; el contenido proviene de sitios de terceros y su uso es responsabilidad de quien despliega y usa la API.
