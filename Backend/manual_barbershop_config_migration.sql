START TRANSACTION;

-- Adiciona a coluna WorkDays à tabela Barbearias
DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Barbearias' AND column_name = 'WorkDays') THEN
        ALTER TABLE "Barbearias" ADD "WorkDays" text NOT NULL DEFAULT 'monday,tuesday,wednesday,thursday,friday,saturday';
    END IF;
END $EF$;

-- Adiciona a coluna OpenTime à tabela Barbearias
DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Barbearias' AND column_name = 'OpenTime') THEN
        ALTER TABLE "Barbearias" ADD "OpenTime" text NOT NULL DEFAULT '08:00';
    END IF;
END $EF$;

-- Adiciona a coluna CloseTime à tabela Barbearias
DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Barbearias' AND column_name = 'CloseTime') THEN
        ALTER TABLE "Barbearias" ADD "CloseTime" text NOT NULL DEFAULT '18:00';
    END IF;
END $EF$;

-- Registra a migração no histórico do Entity Framework Core
DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250909160256_AddBarbershopConfigFieldsForConfig') THEN
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        VALUES ('20250909160256_AddBarbershopConfigFieldsForConfig', '8.0.0');
    END IF;
END $EF$;

COMMIT;


