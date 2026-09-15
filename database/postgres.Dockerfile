FROM postgres:16-alpine

COPY backend/src/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY backend/src/database/seed.sql /docker-entrypoint-initdb.d/02-seed.sql
COPY backend/src/database/migration_minera_1_2_5.sql /docker-entrypoint-initdb.d/02b-migration_minera_1_2_5.sql
COPY database/migration_v3_emergencias_y_seguros.sql /docker-entrypoint-initdb.d/03-migration_v3.sql
COPY database/migration_v4_seguridad.sql /docker-entrypoint-initdb.d/04-migration_v4.sql
COPY database/migration_v5_blindaje_no_invasivo.sql /docker-entrypoint-initdb.d/05-migration_v5.sql
