# VALETEC - Sistema de Onboarding y Acreditación Minera

Sistema integral para la gestión de accesos, acreditación y control de cumplimiento normativo (seguridad, salud ocupacional y legal) de empresas contratistas en unidades mineras.

---

## 🏛️ Arquitectura del Sistema

El proyecto sigue una arquitectura desacoplada y modular con monorepo organizado:

```
SISTEMA-MINA-RRHH/
├── docker-compose.yml              # Orquestador: PostgreSQL 16 + Backend API + Frontend SPA
├── .env.example                    # Plantilla de variables de entorno
├── onboarding.html                 # Maqueta HTML estática original de referencia
│
├── backend/                        # API RESTful (Node.js + TypeScript + Express)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/                 # Conexión PostgreSQL (pg pool) y variables
│       ├── database/
│       │   ├── schema.sql          # Tablas, llaves foráneas, índices y constraints
│       │   └── seed.sql            # Datos semilla basados en la maqueta
│       ├── middlewares/            # Auth JWT, Role Guard (RBAC), Multer upload, Error Handler
│       ├── modules/
│       │   ├── auth/               # Login, JWT, perfiles
│       │   ├── contratistas/       # Gestión de Empresas Contratistas Mineras (ECM)
│       │   ├── postulantes/        # Registro de postulantes, historial y subsanaciones
│       │   ├── fases/              # Lógica de las 5 compuertas (Gates) de evaluación
│       │   ├── lista-negra/        # Bloqueo transversal en unidad minera
│       │   └── fotocheck/          # Generación QR, tarjeta y control de impresión
│       ├── routes.ts               # Router central `/api`
│       ├── app.ts                  # Configuración de Express, CORS y estáticos
│       └── server.ts               # Punto de entrada y prueba de conexión a BD
│
└── frontend/                       # SPA React 18 + Vite + Tailwind CSS + Lucide Icons
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── types/                  # Tipos TypeScript compartidos (Postulante, Fotocheck, etc.)
        ├── services/api.ts         # Cliente Axios con interceptor de autorización
        ├── components/
        │   ├── layout/             # Sidebar dinámico, Header con selector de rol
        │   └── common/             # Badges de estado, Modales interactivos
        └── views/
            ├── PortalContratista.tsx # Tabla de postulantes y modal para resubir PDF
            ├── Fase1CV.tsx          # Filtro 1: Datos y CV (Aprobar / Observar)
            ├── Fase2Salud.tsx       # Filtro 2: EMO/Tox (Apto Médico / NO APTO Lista Negra)
            ├── Fase3Antecedentes.tsx# Filtro 3: Policial/Penal (Sin Antecedentes / NO APTO)
            ├── Fase4Capacitacion.tsx# Filtro 4: Inducción SSOMA (Notas 0-20, Subir examen)
            ├── Fase5SCTR.tsx        # Filtro 5: Validación SCTR y fecha vigencia
            └── FotocheckView.tsx    # Centro de emisión e impresión de credenciales QR
```

---

## 🚦 Flujo de Acreditación Minera (Compuertas)

1. **Portal Contratista**: Registro de postulantes y carga de CVs iniciales. Si una fase es observada, el contratista cuenta con el botón **"Resubir PDF / Subsanar"**.
2. **Fase 1 (Datos y CV)**: RRHH valida experiencia en minería subterránea/superficie.
3. **Fase 2 (Salud Ocupacional)**: Médico valida examen EMO y toxicológico. Dictamen negativo dispara **Inclusión inmediata en Lista Negra**.
4. **Fase 3 (Antecedentes)**: Seguridad Patrimonial revisa antecedentes judiciales y penales. Dictamen negativo dispara **Lista Negra**.
5. **Fase 4 (Capacitación e Inducción SSOMA)**: Se registra la nota del examen (nota mínima 14/20) y se adjunta el examen en PDF.
6. **Fase 5 (SCTR y Seguros)**: Se valida la póliza de alto riesgo y se registra la fecha de expiración.
7. **Meta: Fotocheck**: Se genera la tarjeta de fotocheck minero con código QR, tipo de sangre, empresa y botón para imprimir y autorizar garita.

---

## 🚀 Puesta en Marcha con Docker

Dado que **Docker Desktop** se encuentra instalado, puedes levantar todo el ecosistema (PostgreSQL, Backend y Frontend) con un solo comando:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api`
- **PostgreSQL**: `localhost:5432` (Base de datos: `mina_onboarding_db`)

---

## 👤 Usuarios y Roles Semilla para Pruebas

| Rol | Correo | Clave | Módulo Principal |
| :--- | :--- | :--- | :--- |
| **Contratista (ECM)** | `contratista@serviciosxyz.com` | `Password123!` | Portal Contratista |
| **Staff RRHH** | `rrhh@valetec.com` | `Password123!` | Fase 1: Datos y CV |
| **Médico Ocupacional** | `salud@valetec.com` | `Password123!` | Fase 2: Salud (EMO) |
| **Seguridad Patrimonial** | `seguridad@valetec.com` | `Password123!` | Fase 3: Antecedentes |
| **Instructor SSOMA** | `capacitacion@valetec.com` | `Password123!` | Fase 4: Capacitación |
| **Admin Contratos** | `seguros@valetec.com` | `Password123!` | Fase 5: SCTR |
| **Control de Accesos** | `accesos@valetec.com` | `Password123!` | Meta: Fotocheck |
