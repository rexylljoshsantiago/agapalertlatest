ALTER TABLE flood_levels
    DROP COLUMN river_meters,
    DROP COLUMN set_by;

ALTER TABLE weather_readings
    DROP COLUMN location_name,
    DROP COLUMN report_date,
    DROP COLUMN temp_class,
    DROP COLUMN humidity,
    DROP COLUMN chance_of_rain;
