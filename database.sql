CREATE DATABASE IF NOT EXISTS agapalert
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agapalert;

CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fname         VARCHAR(50)  NOT NULL,
    mname         VARCHAR(50)  NULL,
    lname         VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NULL UNIQUE,
    phone_number  VARCHAR(15)  NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('resident','official','admin') NOT NULL DEFAULT 'resident',
    status        ENUM('active','pending','rejected') NOT NULL DEFAULT 'active',
    avatar_path   VARCHAR(255) NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invite_codes (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    note       VARCHAR(255) NULL,
    created_by INT UNSIGNED NOT NULL,
    used_by    INT UNSIGNED NULL,
    status     ENUM('unused','used','expired') NOT NULL DEFAULT 'unused',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by)    REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE users ADD COLUMN invite_code VARCHAR(20);

ALTER TABLE users
    ADD CONSTRAINT fk_user_invite_code
    FOREIGN KEY (invite_code) REFERENCES invite_codes(code);

CREATE TABLE shelters (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    zone        VARCHAR(120) NOT NULL,
    landmark    VARCHAR(120) NOT NULL,
    capacity    INT UNSIGNED NOT NULL DEFAULT 0,
    occupancy   INT UNSIGNED NOT NULL DEFAULT 0,
    contact     VARCHAR(60)  NULL,
    is_open     TINYINT(1)   NOT NULL DEFAULT 1,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE weather_readings (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone               VARCHAR(120),
    latitude           DECIMAL(9,6)  NOT NULL,
    longitude          DECIMAL(9,6)  NOT NULL,
    weather_condition  VARCHAR(60)   NULL,
    temperature        DECIMAL(5,2)  NULL,
    rain_mm            DECIMAL(6,2)  NULL,
    wind_speed_kmh     DECIMAL(6,2)  NULL,
    wind_direction_deg SMALLINT UNSIGNED NULL,
    recorded_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NULL,
    zone        VARCHAR(255) NULL,
    status      ENUM('new','acknowledged','dispatched','resolved') NOT NULL DEFAULT 'new',
    is_sos      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE report_acknowledgement (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    report_id       INT UNSIGNED NOT NULL,
    acknowledged_by INT UNSIGNED NOT NULL,
    feedback        TEXT         NOT NULL,

    FOREIGN KEY (report_id)       REFERENCES reports(id) ON DELETE RESTRICT,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)   ON DELETE RESTRICT
);

CREATE TABLE flood_levels (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    level      TINYINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '0=Normal 1=Watch 2=Warning 3=Critical',
    wind_kmh   DECIMAL(5,1)      NOT NULL DEFAULT 0,
    rain_mmh   DECIMAL(5,1)      NOT NULL DEFAULT 0,
    notes      VARCHAR(255)      NULL,
    created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    marked_by  INT UNSIGNED      NOT NULL,

    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE login_attempts (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip           VARCHAR(45)  NOT NULL,
    attempted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_time (ip, attempted_at)
);

CREATE TABLE password_resets (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    code_hash  VARCHAR(255) NOT NULL,
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_reset (user_id, used, expires_at)
);

DELIMITER $$
CREATE PROCEDURE RecordWeather(
    IN p_zone               VARCHAR(120),
    IN p_latitude           DECIMAL(9,6),
    IN p_longitude          DECIMAL(9,6),
    IN p_weather_condition  VARCHAR(60),
    IN p_temperature        DECIMAL(5,2),
    IN p_rain_mm            DECIMAL(6,2),
    IN p_wind_speed_kmh     DECIMAL(6,2),
    IN p_wind_direction_deg SMALLINT UNSIGNED
)
BEGIN
    START TRANSACTION;
        DELETE FROM weather_readings
        WHERE zone = p_zone
          AND recorded_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE);

        INSERT INTO weather_readings (
            zone, latitude, longitude, weather_condition,
            temperature, rain_mm, wind_speed_kmh,
            wind_direction_deg, recorded_at
        ) VALUES (
            p_zone, p_latitude, p_longitude, p_weather_condition,
            p_temperature, p_rain_mm, p_wind_speed_kmh,
            p_wind_direction_deg, NOW()
        );
    COMMIT;
END$$
DELIMITER ;

-- ── Seeds ─────────────────────────────────────────────────────────────────────
-- Default admin account (password: admin123 — change after first login)
INSERT INTO users (fname, lname, email, password_hash, role, status)
VALUES ('System', 'Administrator', 'admin@agapalert.ph',
        '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin', 'active');

-- Default evacuation center
INSERT INTO shelters (name, zone, landmark, capacity, occupancy, contact)
VALUES ('Dalongue Barangay Evacuation Hall', 'Dalongue',
        'Near the barangay hall', 180, 0, '(075) 518-2024');

-- Initial flood level (marked_by = admin user id 1)
INSERT INTO flood_levels (level, wind_kmh, rain_mmh, notes, marked_by)
VALUES (0, 12, 0.5, 'Initial baseline reading', 1);
