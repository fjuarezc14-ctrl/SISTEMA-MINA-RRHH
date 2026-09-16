FROM postgres:16-alpine

# Solo el bootstrap de una base de datos nueva. Los scripts de
# docker-entrypoint-initdb.d se ejecutan únicamente cuando el volumen está
# vacío, por lo que las migraciones las aplica el backend al arrancar
# (backend/src/database/migrate.ts), tanto en bases nuevas como existentes.
COPY backend/src/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY backend/src/database/seed.sql /docker-entrypoint-initdb.d/02-seed.sql
