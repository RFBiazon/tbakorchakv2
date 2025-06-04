-- Migration: Limpeza da tabela Operador para manter apenas os campos necessários
-- Lista de campos a manter:
-- id, parent_id, name, last_name, username, email, phone, country_code, cpf, level, profile, is_profile, profile_permission, image, image_key, full_name, should_update_at, pin_code, created_at, updated_at

ALTER TABLE "Operador" DROP COLUMN IF EXISTS scholarity;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS marital_status;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS atuation;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS courses;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS is_married;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS cep;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS address;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS state;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS city;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS district;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS complement;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS ruc;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS distrito_py;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS user_twygo_id;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS magic_link_twygo;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS user_twygo_status;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS expire_pin;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS password_confirmation;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS passwordExpireIn;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS first_access;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS pin_phone;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS birthday;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS gender;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS country_code;-- Migration: Remove timestamp columns from Operador table
ALTER TABLE "Operador" DROP COLUMN IF EXISTS should_update_at;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS created_at;
ALTER TABLE "Operador" DROP COLUMN IF EXISTS updated_at;
 