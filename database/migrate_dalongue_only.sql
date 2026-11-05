-- Run once on an existing agapalert database (phpMyAdmin or mysql CLI).

USE agapalert;

ALTER TABLE flood_levels
    ADD COLUMN sms_sent   SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER notes,
    ADD COLUMN sms_failed SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER sms_sent;

DELETE FROM shelters WHERE barangay_id IS NULL OR barangay_id != 1;
DELETE FROM barangays WHERE id != 1;
UPDATE users SET barangay_id = 1 WHERE barangay_id IS NULL OR barangay_id != 1;
