# VALETEC - Sistema de Onboarding y Acreditación Minera

Sistema integral para la gestión de accesos, acreditación y control de cumplimiento normativo (seguridad, salud ocupacional y legal) de empresas contratistas en unidades mineras.

---

## 🏛️ Puertos Asignados (100% Libres de Conflicto)

Los puertos han sido configurados para convivir sin ninguna colisión con tus otros contenedores Docker en ejecución:

| Servicio | Puerto Host (Windows) | Puerto Contenedor | URL de Acceso |
| :--- | :---: | :---: | :--- |
| **Frontend Web (SPA React + Nginx)** | **`5150`** | `80` | **`http://localhost:5150`** |
| **Backend API (Node.js + Express)** | **`4050`** | `4050` | **`http://localhost:4050/api`** |
| **PostgreSQL 16 (Base de Datos)** | **`5450`** | `5432` | `localhost:5450` *(DB: mina_onboarding_db)* |

---

## 🚀 Estado de los Contenedores

Todos los servicios están orquestados con **Docker Compose**:

```bash
docker compose up -d
```

### Para verificar el estado de los contenedores:
```bash
docker ps --filter "name=mina_"
```

| Contenedor | Imagen | Estado | Puerto Mapeado |
| :--- | :--- | :---: | :--- |
| `mina_frontend` | `sistema-mina-rrhh-frontend` | **Up (200 OK)** | `0.0.0.0:5150->80/tcp` |
| `mina_backend` | `sistema-mina-rrhh-backend` | **Up (Health OK)** | `0.0.0.0:4050->4050/tcp` |
| `mina_postgres` | `postgres:16-alpine` | **Up (Healthy)** | `0.0.0.0:5450->5432/tcp` |

---

## 👤 Credenciales Semilla para Acceso

| Rol | Correo | Clave | Módulo Principal |
| :--- | :--- | :--- | :--- |
| **Super Admin (Mina)** | `admin@valetec.com` | `Password123!` | Panel Super Admin (Control Total) |
| **Staff RRHH** | `rrhh@valetec.com` | `Password123!` | 1. V°B° RRHH (Datos y CV) |
| **Médico Ocupacional** | `salud@valetec.com` | `Password123!` | 2. V°B° Médico (EMO / Tox) |
| **Seguridad Patrimonial** | `seguridad@valetec.com` | `Password123!` | 3. V°B° Seguridad (Antecedentes) |
| **Instructor SSOMA** | `capacitacion@valetec.com` | `Password123!` | 4. V°B° SSOMA (Inducción \(\ge 14\)) |
| **Admin Contratos** | `seguros@valetec.com` | `Password123!` | 5. V°B° SCTR (Póliza de Riesgo) |
| **Control de Accesos** | `accesos@valetec.com` | `Password123!` | Meta: Emisión Fotocheck y QR |
| **Contratista (ECM)** | `contratista@serviciosxyz.com` | `Password123!` | Portal Contratista (Subsanación v2) |
