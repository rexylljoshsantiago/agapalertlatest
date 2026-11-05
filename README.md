# AgapAlert

Isang flood early-warning system para sa Barangay Dalongue, Santa Barbara, Pangasinan.

## Mga Tampok

- **Live na antas ng baha** — ina-update ng admin/opisyal, nakikita agad ng lahat ng residente
- **Mga evacuation center** — live na occupancy at ruta mula sa iyong lokasyon (Leaflet + OSRM)
- **SOS** — hold-to-send, nai-save sa database, nakikita ng mga opisyal
- **Mga ulat ng komunidad** — residente at opisyal ay maaaring mag-ulat ng insidente
- **Panahon** — live weather mula sa Open-Meteo (walang API key)
- **Admin panel** — pamahalaan ang mga opisyal, invite code, antas ng baha, at occupancy ng shelters

## Pag-setup

### Kinakailangan

- XAMPP (Apache + MySQL, PHP 8.x)

### Mga Hakbang

1. Ilagay ang folder sa `C:\xampp\htdocs\agapalert`
2. I-start ang Apache at MySQL sa XAMPP Control Panel
3. Pumunta sa `http://localhost/phpmyadmin`, gumawa ng database na `agapalert`
4. I-run ang `http://localhost/agapalert/config/setup.php` sa browser
5. Pumunta sa `http://localhost/agapalert/login.html`

### Default Admin Account

```
Email:    admin@agapalert.ph
Password: admin123
```

> **Palitan ang password pagkatapos mag-login.**

## Istruktura ng Proyekto

```
agapalert/
├── api/                  PHP API endpoints
│   ├── admin/            Admin-only endpoints (pending, officials, codes, shelters)
│   ├── profile/          Profile update, avatar, password
│   ├── flood.php         GET/POST flood level
│   ├── reports.php       GET/POST/PATCH incident reports
│   ├── shelters.php      GET shelter data
│   └── weather.php       GET live weather (Open-Meteo)
├── assets/
│   ├── css/              Stylesheets
│   ├── js/               Frontend JavaScript
│   └── lib/              Leaflet.js (lokal, walang CDN)
├── config/               DB config, auth helpers, setup script
├── uploads/avatars/      Profile photos
├── database.sql          Schema + seed data
├── index.html            Dashboard (pangunahing app)
├── login.html            Login page
├── register.html         Registration page
├── profile.html          Profile page
└── admin.html            Admin panel
```

## Teknolohiya

| Bahagi | Gamit |
|--------|-------|
| Backend | PHP 8 + PDO (MySQL) |
| Frontend | Vanilla JS, walang framework |
| Mapa | Leaflet.js + OpenStreetMap tiles |
| Ruta | OSRM public routing API |
| Panahon | Open-Meteo API (libre, walang key) |
| Auth | PHP sessions + bcrypt |

## Mga API Endpoint

| Endpoint | Paraan | Paglalarawan |
|----------|--------|--------------|
| `api/login.php` | POST | Mag-sign in |
| `api/logout.php` | POST | Mag-sign out |
| `api/register.php` | POST | Gumawa ng account |
| `api/me.php` | GET | Kasalukuyang user |
| `api/flood.php` | GET/POST | Antas ng baha |
| `api/reports.php` | GET/POST/PATCH | Mga ulat at SOS |
| `api/shelters.php` | GET | Mga likasan |
| `api/weather.php` | GET | Live na panahon |
| `api/admin/pending.php` | GET/POST | Apruba/tanggihan ang opisyal |
| `api/admin/codes.php` | GET/POST/DELETE | Mga invite code |
| `api/admin/officials.php` | GET/POST | Mga opisyal |
| `api/admin/shelters.php` | GET/PATCH | Occupancy ng likasan |

## SMS abiso (opsyonal)

1. Gumawa ng account sa [Semaphore](https://semaphore.co) at kumuha ng API key.
2. I-edit ang `config/sms.php`: itakda ang `enabled` sa `true` at ilagay ang `api_key`.
3. Siguraduhing may valid na mobile number ang mga residente sa profile (09… format).

Kapag naglabas ng abiso ang opisyal o nag-update ang admin ng antas ≥ 1, papadalhan ng SMS ang lahat ng rehistradong numero sa **Barangay Dalongue**.

## Lumang database

Kung naka-setup na ang proyekto bago ang Dalongue-only update, i-run ang `database/migrate_dalongue_only.sql` sa phpMyAdmin.

---

*AgapAlert — Dalongue, Santa Barbara, Pangasinan*
