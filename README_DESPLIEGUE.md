# Despliegue local del TFG LaLiga

Este documento explica cómo ejecutar la aplicación completa mediante Docker para
su evaluación. No es necesario instalar Node.js, PostgreSQL ni Python en el
ordenador: esas herramientas y sus dependencias se incluyen en los contenedores.

## Requisitos

- Docker Desktop con Docker Compose.
- Git, si se va a clonar el repositorio.
- Expo Go compatible con Expo SDK 54. Puede comprobarse en Expo Go mediante Client version → Supported SDK. En Android, si la versión instalada no soporta SDK 54, puede descargarse una compatible desde https://expo.dev/go.
- El teléfono y el ordenador conectados a la misma red local.
- Conexión a Internet durante la primera construcción de las imágenes.

## Servicios incluidos

Docker Compose pone en marcha tres servicios:

| Servicio | Contenido | Acceso |
| --- | --- | --- |
| `database` | PostgreSQL 18 y los datos de LaLiga | Solo desde la red interna de Docker |
| `backend` | API Express y Python para Monte Carlo | `http://localhost:3000` |
| `frontend` | Expo y Metro Bundler | `http://localhost:8081` |

## 1. Obtener el proyecto

```powershell
git clone https://github.com/rafaPG03/TFG_LaLiga.git
cd TFG_LaLiga
```

Todos los comandos de este documento deben ejecutarse desde esta carpeta raíz,
donde se encuentra `docker-compose.yml`.

## 2. Configurar las variables de entorno

Crear el archivo `.env` a partir de la plantilla incluida en el repositorio.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Docker Compose utiliza únicamente el `.env` de la raíz. El archivo
`backend/.env`, si existe, solo se utiliza al ejecutar el backend localmente sin
Docker.

### Dirección IP local

Para utilizar Expo Go se debe indicar la dirección IPv4 del ordenador dentro de
la red local. En Windows puede consultarse con:

```powershell
ipconfig
```

Se debe buscar la dirección IPv4 del adaptador Wi-Fi activo. Por ejemplo, si es
`192.168.1.42`, el `.env` debe contener:

```env
LAN_IP=192.168.1.42
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000/api
```

No se debe utilizar `localhost` en `EXPO_PUBLIC_API_URL`: desde el teléfono,
`localhost` se refiere al propio dispositivo y no al ordenador.

### Configuración completa

La plantilla incluye estas variables:

```env
LAN_IP=192.168.1.42
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000/api
DB_NAME=TFG_BDLaLiga
DB_PASSWORD=tfg_laliga
BACKEND_PORT=3000
GEMINI_API_KEY=
JWT_SECRET=cambia-este-secreto-por-uno-largo-y-aleatorio
JWT_EXPIRES_IN=7d
```

`GEMINI_API_KEY` es opcional. Sin ella funcionará toda la aplicación excepto el
chatbot. La clave real debe escribirse en `.env`, nunca en `.env.example`, ya que
la plantilla sí se publica en GitHub.

## 3. Construir y arrancar la aplicación

Abrir Docker Desktop y ejecutar:

```powershell
docker compose up --build
```

La primera ejecución puede tardar varios minutos porque descarga las imágenes,
instala las dependencias e importa la base de datos. La terminal permanecerá
mostrando los registros de los tres servicios.

También se puede ejecutar en segundo plano:

```powershell
docker compose up --build -d
```

## 4. Abrir la aplicación en Expo Go

El QR aparece en los registros del frontend. Si Compose se ejecutó en segundo
plano, se puede mostrar con:

```powershell
docker compose logs -f frontend
```

Abrir Expo Go y escanear el código QR. Para salir de la vista de registros se
utiliza `Ctrl+C`; esto no detiene los contenedores.

El primer bundle de Android o iOS puede tardar unos segundos más que los
siguientes.

## 5. Comprobar los servicios

Consultar el estado de los contenedores:

```powershell
docker compose ps
```

Los servicios `database` y `backend` deben aparecer como `healthy`. También se
pueden abrir las siguientes direcciones en el navegador del ordenador:

- API REST: <http://localhost:3000/api>
- Swagger UI: <http://localhost:3000/api-docs>
- Metro Bundler: <http://localhost:8081>

## Consultar los registros

Frontend y código QR:

```powershell
docker compose logs -f frontend
```

Backend, consultas y errores del chatbot:

```powershell
docker compose logs -f backend
```

PostgreSQL e importación inicial:

```powershell
docker compose logs -f database
```

Últimas 100 líneas del backend:

```powershell
docker compose logs --tail 100 backend
```

Backend y base de datos simultáneamente:

```powershell
docker compose logs -f backend database
```

## Base de datos inicial

El volcado completo se encuentra en:

```text
database/init/01_laliga_completa.sql
```

PostgreSQL lo importa automáticamente al crear el volumen por primera vez. Los
archivos de `database/init` no vuelven a ejecutarse mientras exista un volumen ya
inicializado.

Para eliminar el volumen y repetir la importación desde cero:

```powershell
docker compose down --volumes
docker compose up --build
```

El primer comando elimina permanentemente los cambios realizados en la base de
datos local, incluidos usuarios, favoritos y demás datos creados durante las
pruebas.

## Detener la aplicación

Si Compose se está ejecutando en primer plano, pulsar `Ctrl+C`. Después se pueden
retirar los contenedores y conservar la base de datos con:

```powershell
docker compose down
```

En el siguiente arranque se reutilizará el volumen existente:

```powershell
docker compose up
```

Solo es necesario añadir `--build` cuando sea la primera ejecución o hayan
cambiado el código, los Dockerfiles o las dependencias.

## Solución de problemas

### Expo Go no conecta o el QR contiene `localhost`

1. Comprobar `LAN_IP` y `EXPO_PUBLIC_API_URL` en el `.env` raíz.
2. Confirmar que teléfono y ordenador están en la misma red Wi-Fi.
3. Desactivar temporalmente una VPN si está modificando la red local.
4. Permitir conexiones entrantes a los puertos 3000 y 8081 en el cortafuegos.
5. Recrear el frontend después de cambiar variables de Expo:

```powershell
docker compose up -d --build --force-recreate frontend
```

### El chatbot devuelve un error 403 de Gemini

Comprobar que `GEMINI_API_KEY` está en el `.env` de la raíz y recrear el backend:

```powershell
docker compose up -d --force-recreate backend
```

Se puede verificar que la clave llegó al contenedor sin mostrar su valor:

```powershell
docker compose exec backend node -e "console.log((process.env.GEMINI_API_KEY || '').length)"
```

El resultado debe ser distinto de cero.

### Se ha sustituido el volcado pero aparecen los datos anteriores

El volumen ya estaba inicializado. Para importar el nuevo volcado se debe
recrear expresamente:

```powershell
docker compose down --volumes
docker compose up --build
```

### Un puerto ya está ocupado

Detener el programa que utiliza el puerto o cambiar `BACKEND_PORT` en `.env`. Si
se cambia el puerto del backend, también debe actualizarse el puerto incluido en
`EXPO_PUBLIC_API_URL`.

## Archivos que no deben publicarse

No se deben subir a GitHub:

- `.env` y `backend/.env`.
- Claves API, contraseñas reales o secretos JWT.
- `node_modules`, `.expo`, `dist` o cachés de Python.
- Volúmenes, contenedores o imágenes exportadas de Docker.

Sí deben publicarse `.env.example`, los Dockerfiles, `docker-compose.yml`,
`backend/requirements.txt` y el volcado definitivo utilizado para la evaluación.
