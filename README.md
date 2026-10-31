# ConocemeSV

ConocemeSV es un MVP para explorar y diseñar rutas turísticas en El Salvador. La prueba de concepto integra un mapa interactivo con marcadores editables y arrastrables, un flujo guiado para crear rutas y una secuencia simulada de registro, inicio de sesión y control de sesión.

> **Alcance:** la autenticación y los controles descritos aquí se ejecutan en el frontend y usan almacenamiento del navegador. Son una demostración técnica, no un sistema de seguridad apto para producción ni una protección de datos sensibles.

## Funcionalidades principales

### Mapa de El Salvador

- Mapa interactivo implementado con [Leaflet](https://leafletjs.com/) y mosaicos de [OpenStreetMap](https://www.openstreetmap.org/), con atribución visible.
- El mapa inicia centrado en El Salvador y limita el desplazamiento y el zoom a una región del país.
- La ubicación actual se puede solicitar mediante la geolocalización del navegador; requiere permiso del usuario y puede no estar disponible.
- Los marcadores se pueden agregar desde un catálogo de categorías (lugares turísticos, cultura, gastronomía, actividades y estilos de marcador), mover directamente en el mapa, editar o eliminar.
- Una línea conecta los marcadores para visualizar el recorrido. Al mover un marcador, se actualizan sus coordenadas y la línea.

### Creación de rutas turísticas

La sección **Crear mi ruta** guía al usuario por un flujo de pasos:

1. Elegir categoría y completar título y descripción.
2. Agregar marcadores desde el catálogo al mapa. Cada marcador crea una parada asociada.
3. Completar para cada parada su nombre, descripción, ubicación, presupuesto, clima, afluencia y mejor día y hora para visitarla.
4. Revisar el resumen y guardar la ruta.

El formulario valida campos obligatorios, longitudes y datos completos de las paradas. Las rutas creadas se guardan en el navegador y aparecen en el catálogo, agrupadas por categoría y ordenadas por puntuación cuando esta existe. El catálogo también incluye rutas de ejemplo.

### Registro, inicio de sesión y sesión

- Registro con nombre, apellido, correo, contraseña, confirmación y aceptación de términos.
- Validación de formato del correo, longitud mínima de contraseña, coincidencia de contraseñas y unicidad del correo.
- Inicio de sesión con correo y contraseña. Al cerrar sesión se elimina la sesión local.
- Las rutas `/auth/register` y `/auth/login` son públicas; `/home` está protegida por un guard de Angular que comprueba la sesión y el usuario.
- Las sesiones duran 10 minutos. Cuando faltan 5 minutos aparece un diálogo para renovar o cerrar sesión; si vence el tiempo, se redirige al inicio de sesión.

## Arquitectura

La aplicación es una SPA de Angular con componentes standalone, Angular Material/CDK, formularios reactivos y estado reactivo con Signals.

```text
src/app/
├── app.ts                         # Inicialización y monitor de sesión
├── app.routes.ts                  # Rutas públicas y área protegida
├── guards/
│   └── auth.guard-guard.ts        # Protección de /home en el cliente
├── layout/
│   ├── auth-layout/               # Contenedor de autenticación
│   └── main-layout/               # Navegación del área principal
├── pages/
│   ├── auth/login/                # Formulario de inicio de sesión
│   ├── auth/register/             # Formulario de registro
│   └── home/                      # Catálogo y creación de rutas
├── services/
│   ├── auth.service.ts            # Hash de contraseña y sesión simulada
│   ├── map.service.ts             # Estado y operaciones de marcadores
│   └── storage.service.ts         # Persistencia local de usuarios y rutas
├── shared/
│   ├── map/                       # Mapa Leaflet y eventos de marcadores
│   ├── card-form/                 # Edición de datos de paradas
│   ├── card-generic/              # Presentación de rutas
│   └── session-renewal-dialog/    # Aviso y renovación de sesión
├── store/
│   ├── Routes.ts                  # Rutas de ejemplo
│   ├── Tools.ts                   # Catálogo de marcadores
│   └── Users.ts                   # Usuarios de demostración
└── types/                         # Modelos de usuario, ruta y marcador
```

### Responsabilidades y flujo

- **Presentación:** `pages/` y `layout/` componen las pantallas y la navegación. La página de inicio coordina los pasos de creación y los formularios.
- **Mapa:** el componente `shared/map/` encapsula Leaflet y emite eventos de movimiento, edición y eliminación. `MapService` mantiene los marcadores mediante Signals y sincroniza los cambios con el mapa.
- **Autenticación:** `AuthService` valida credenciales y administra el estado de sesión; `authGuardGuard` protege la navegación del lado cliente.
- **Persistencia:** `StorageService` centraliza la lectura y escritura de usuarios y rutas. Al iniciar, `app.ts` carga los datos de ejemplo en `localStorage` si aún no existen.
- **Modelos:** `types/` define las estructuras principales utilizadas por formularios, servicios y componentes.

## Seguridad: secuencia demostrativa y límites

El MVP implementa una secuencia para mostrar conceptos básicos, pero **no ofrece autenticación ni autorización confiables**:

1. En el registro, el navegador genera un salt aleatorio con Web Crypto y deriva un hash PBKDF2-SHA-256 con 100,000 iteraciones. Se almacena el algoritmo, las iteraciones, el salt y el hash; no se guarda la contraseña en texto plano.
2. En el inicio de sesión, se vuelve a derivar el hash con el salt guardado y se compara con el valor registrado.
3. Tras autenticar, se genera un valor aleatorio para una sesión con vencimiento de 10 minutos. La sesión se guarda en `sessionStorage`.
4. El guard verifica que exista una sesión no vencida y que su identificador de usuario corresponda a un usuario local. El monitor muestra un aviso antes del vencimiento y permite renovar o cerrar la sesión.

### Limitaciones importantes

- El navegador y su almacenamiento están bajo control del usuario. Los datos de `localStorage` y `sessionStorage` se pueden leer, modificar o borrar desde las herramientas del navegador.
- El token es un valor aleatorio local, **no es un JWT firmado** ni se valida en un servidor. El guard solo controla la navegación de la interfaz; no puede proteger datos ni operaciones en un backend.
- La verificación de contraseña y el hash se realizan en el cliente. Un usuario con control del navegador puede alterar el código o el estado de la aplicación.
- Usuarios, rutas y datos personales de demostración se almacenan en `localStorage`; no hay base de datos, API, control de acceso en servidor, recuperación de cuenta ni revocación centralizada.
- PBKDF2 y Web Crypto en el cliente no convierten este diseño en almacenamiento seguro de credenciales para producción. Un hash expuesto puede someterse a intentos offline.

Para una aplicación real, la autenticación, autorización, persistencia y validación deben implementarse en un backend confiable. Se recomienda usar HTTPS, almacenamiento de contraseñas con un algoritmo adaptativo configurado en servidor, sesiones protegidas con cookies `HttpOnly`, `Secure` y `SameSite`, controles de acceso en cada operación y medidas contra abuso. No se deben incluir secretos ni credenciales reales en el frontend o en los datos de ejemplo.

## Tecnologías

- Angular 22 y TypeScript
- Angular Material y CDK
- Leaflet y mosaicos de OpenStreetMap
- RxJS y Angular Signals
- Tailwind CSS y Remix Icon
- Vitest para pruebas unitarias mediante Angular CLI

## Requisitos y ejecución

Se requiere Node.js y npm compatibles con la versión instalada de Angular CLI.

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. La aplicación inicializa datos de ejemplo en el almacenamiento local del navegador cuando no existen.

## Comandos

```bash
npm start       # Servidor de desarrollo
npm run build   # Compilación
npm test        # Pruebas unitarias
```

## Estructura de datos del MVP

- **Usuario:** identidad básica, correo, hash de contraseña, rutas asociadas y estadísticas de demostración.
- **Ruta:** categoría, título, descripción, autor, paradas y métricas de recorrido.
- **Parada:** nombre, descripción, ubicación, presupuesto, afluencia, clima y horario recomendado.
- **Marcador:** identificador, coordenadas, orden, icono, color y datos asociados a una parada.
