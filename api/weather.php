<?php
require_once __DIR__ . '/bootstrap.php';
require_method('GET');

$lat        = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lon        = filter_input(INPUT_GET, 'lon', FILTER_VALIDATE_FLOAT);
$barangayId = isset($_GET['barangay_id']) ? (int) $_GET['barangay_id'] : null;

if ($lat === false || $lon === false || $lat === null || $lon === null)
    json_response(['ok' => false, 'error' => 'Valid lat and lon are required.'], 400);

$db = db();

$cache = $db->prepare(
    "SELECT * FROM weather_readings
     WHERE  ABS(latitude - ?) < 0.01
       AND  ABS(longitude - ?) < 0.01
       AND  recorded_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     ORDER  BY recorded_at DESC
     LIMIT  1"
);
$cache->execute([$lat, $lon]);
$cached = $cache->fetch();

if ($cached) {
    json_response(['ok' => true, 'source' => 'cache', 'weather' => formatRow($cached)]);
}

// Fetch  
$url = "https://api.open-meteo.com/v1/forecast?"
     . "latitude=$lat"
     . "&longitude=$lon"
     . "&current=temperature_2m,relative_humidity_2m,weather_code,rain,wind_speed_10m,wind_direction_10m"
     . "&daily=precipitation_probability_max"
     . "&timezone=auto";

$context  = stream_context_create([
    'http' => [
        'header'  => "User-Agent: AgapAlert/1.0\r\n",
        'timeout' => 5,
    ],
]);
$response = @file_get_contents($url, false, $context);

if ($response === false)
    json_response(['ok' => false, 'error' => 'Failed to reach weather service.'], 502);

$data = json_decode($response, true);

if (!isset($data['current']))
    json_response(['ok' => false, 'error' => 'Unexpected weather response.'], 502);

//  Reverse-geocode location name 
$geoUrl      = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon";
$geoResponse = @file_get_contents($geoUrl, false, $context);
$geoData     = json_decode($geoResponse, true);

$locationName = $geoData['address']['city']
    ?? $geoData['address']['town']
    ?? $geoData['address']['village']
    ?? 'Unknown Location';

// Parse weather 
$current = $data['current'];
$daily   = $data['daily'];
$temp    = (float) $current['temperature_2m'];

$tempClass = match(true) {
    $temp < 18  => 'Cold',
    $temp <= 27 => 'Cool',
    $temp <= 32 => 'Warm',
    default     => 'Hot',
};

$condition = getSkyCondition((int) $current['weather_code']);

// Store in DB 
$insert = $db->prepare(
    'INSERT INTO weather_readings
        (barangay_id, latitude, longitude, location_name, report_date,
         weather_condition, temperature, temp_class, humidity,
         rain_mm, chance_of_rain, wind_speed_kmh, wind_direction_deg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insert->execute([
    $barangayId,
    $lat,
    $lon,
    $locationName,
    $daily['time'][0],
    $condition,
    $temp,
    $tempClass,
    (int)   $current['relative_humidity_2m'],
    (float) $current['rain'],
    (int)   $daily['precipitation_probability_max'][0],
    (float) $current['wind_speed_10m'],
    (int)   $current['wind_direction_10m'],
]);

$weather = [
    'location_name'      => $locationName,
    'report_date'        => $daily['time'][0],
    'weather_condition'  => $condition,
    'temperature'        => $temp,
    'temp_class'         => $tempClass,
    'humidity'           => (int)   $current['relative_humidity_2m'],
    'rain_mm'            => (float) $current['rain'],
    'chance_of_rain'     => (int)   $daily['precipitation_probability_max'][0],
    'wind_speed_kmh'     => (float) $current['wind_speed_10m'],
    'wind_direction_deg' => (int)   $current['wind_direction_10m'],
];

json_response(['ok' => true, 'source' => 'live', 'weather' => $weather]);

//  Helpers 
function formatRow(array $row): array {
    return [
        'location_name'      => $row['location_name'],
        'report_date'        => $row['report_date'],
        'weather_condition'  => $row['weather_condition'],
        'temperature'        => (float) $row['temperature'],
        'temp_class'         => $row['temp_class'],
        'humidity'           => (int)   $row['humidity'],
        'rain_mm'            => (float) $row['rain_mm'],
        'chance_of_rain'     => (int)   $row['chance_of_rain'],
        'wind_speed_kmh'     => (float) $row['wind_speed_kmh'],
        'wind_direction_deg' => (int)   $row['wind_direction_deg'],
    ];
}

function getSkyCondition(int $code): string {
    return [
        0  => 'Clear Sky',          1  => 'Mainly Clear',
        2  => 'Partly Cloudy',      3  => 'Overcast',
        45 => 'Fog',                48 => 'Rime Fog',
        51 => 'Light Drizzle',      53 => 'Moderate Drizzle',   55 => 'Dense Drizzle',
        61 => 'Slight Rain',        63 => 'Moderate Rain',       65 => 'Heavy Rain',
        71 => 'Slight Snow',        73 => 'Moderate Snow',       75 => 'Heavy Snow',
        80 => 'Slight Shower',      81 => 'Moderate Shower',     82 => 'Violent Shower',
        95 => 'Thunderstorm',       96 => 'Thunderstorm + Hail', 99 => 'Severe Thunderstorm',
    ][$code] ?? 'Unknown';
}
