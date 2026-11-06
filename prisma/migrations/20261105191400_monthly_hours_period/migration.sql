ALTER TABLE `Company`
    ADD COLUMN `horasPeriodo` VARCHAR(7) NOT NULL DEFAULT '1970-01';

UPDATE `Company`
SET `horasPeriodo` = DATE_FORMAT(DATE_SUB(`updatedAt`, INTERVAL 6 HOUR), '%Y-%m');
