# Sistema de Registro de Personal

Aplicación de registro de ingreso de personal con arquitectura de microservicios.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   http://localhost:3000                      │
│         (Proxy unificado → ambos servicios)                  │
└─────────────┬───────────────────────────┬───────────────────┘
              │ REST API                  │ REST API
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────────┐
│   SERVICIO 1        │     │   SERVICIO 2                     │
│   Usuarios          │◄────│   Registros + WebSocket          │
│   :3001             │     │   :3002                          │
│   MySQL: users_db   │     │   MySQL: records_db              │
└─────────────────────┘     └─────────────────────────────────┘
```

## Tecnologías

- **Node.js + Express** — REST API
- **Arquitectura Hexagonal** — Dominio / Aplicación / Infraestructura / Adaptadores
- **WebSockets (ws)** — Actualizaciones en tiempo real
- **MySQL + mysql2** — Base de datos independiente por servicio
- **bcryptjs** — Encriptación de contraseñas

## Requisitos previos

Antes de instalar, asegúrate de tener lo siguiente instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0 o superior (o MySQL Workbench)

## Configuración de base de datos

Abre MySQL Workbench (o cualquier cliente MySQL) y ejecuta:

```sql
CREATE DATABASE users_db;
CREATE DATABASE records_db;
```

## Instalación

### 1. Crear archivos de configuración `.env`

Dentro de la carpeta `servicio1-users/`, crea un archivo llamado `.env` con este contenido:

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña_mysql
DB_NAME=users_db
```

Dentro de la carpeta `servicio2-records/`, crea un archivo llamado `.env` con este contenido:

```
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña_mysql
DB_NAME=records_db
SERVICE1_URL=http://localhost:3001
```

> Reemplaza `tu_contraseña_mysql` con la contraseña de tu instalación de MySQL.
> Si tu usuario root no tiene contraseña, deja `DB_PASS=` en blanco.

### 2. Instalar dependencias (3 terminales separadas)

**Terminal 1 — Servicio 1:**
```bash
cd servicio1-users
npm install
npm start
```

**Terminal 2 — Servicio 2:**
```bash
cd servicio2-records
npm install
npm start
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm start
```

### 3. Abrir la aplicación

Ir a: **http://localhost:3000**

> Las tablas de la base de datos se crean automáticamente al iniciar los servicios.
> Los usuarios de prueba también se insertan automáticamente la primera vez.

## Usuarios de prueba

| Usuario | Contraseña | Nombre        | Horario       | Salario  | Rol      |
|---------|------------|---------------|---------------|----------|----------|
| admin   | admin123   | Administrador | 08:00 – 17:00 | Q15,000  | admin    |
| jperez  | 1234       | Juan Pérez    | 08:00 – 17:00 | Q8,500   | employee |
| mgomez  | 1234       | María Gómez   | 07:00 – 15:00 | Q9,200   | employee |
| clopez  | 1234       | Carlos López  | 14:00 – 22:00 | Q7,800   | employee |
| arojas  | 1234       | Ana Rojas     | 09:00 – 18:00 | Q10,000  | employee |

## Endpoints

### Servicio 1 — Usuarios (puerto 3001)

| Método | Ruta                    | Descripción                        |
|--------|-------------------------|------------------------------------|
| POST   | /api/auth/validate      | Validar usuario (simula huella)    |
| GET    | /api/users              | Listar todos los usuarios          |
| POST   | /api/users              | Crear usuario                      |
| PUT    | /api/users/:id          | Actualizar usuario                 |
| DELETE | /api/users/:id          | Desactivar usuario                 |
| POST   | /api/users/:id/penalty  | Aplicar descuento de salario       |

### Servicio 2 — Registros (puerto 3002)

| Método    | Ruta                       | Descripción                        |
|-----------|----------------------------|------------------------------------|
| POST      | /api/attendance/checkin    | Registrar entrada                  |
| POST      | /api/attendance/checkout   | Registrar salida                   |
| GET       | /api/attendance            | Historial con filtros              |
| GET       | /api/attendance/status     | Estado actual (dentro/fuera)       |
| GET       | /api/attendance/summary    | Resumen del día                    |
| GET       | /api/attendance/stats      | Estadísticas generales             |
| WebSocket | ws://localhost:3002        | Eventos en tiempo real             |

## Lógica de descuentos

- Por cada minuto de **entrada tarde**: descuento del **0.5% del salario**
- Por cada minuto de **salida temprana**: descuento del **0.5% del salario**
- Los descuentos se aplican automáticamente al registrar entrada/salida
- El descuento se deduce del salario en la base de datos del Servicio 1

## Arquitectura Hexagonal aplicada

```
servicio1-users/src/
├── domain/           ← Entidades y puertos (contratos)
│   ├── User.js
│   └── UserRepositoryPort.js
├── application/      ← Casos de uso
│   └── UserUseCases.js
├── infrastructure/   ← Adaptadores de salida (BD, clientes HTTP)
│   └── SQLiteUserRepository.js
└── adapters/         ← Adaptadores de entrada (HTTP routes)
    └── userRoutes.js
```

## Solución de problemas

**Error de conexión a MySQL:** Verifica que MySQL esté corriendo y que la contraseña en `.env` sea correcta.

**Puerto ocupado:** Si el puerto 3001, 3002 o 3000 ya está en uso, cámbialo en el `.env` correspondiente.

**Tablas no creadas:** Los servicios crean las tablas automáticamente al arrancar. Si hay un error, revisa que las bases de datos `users_db` y `records_db` existan en MySQL.
