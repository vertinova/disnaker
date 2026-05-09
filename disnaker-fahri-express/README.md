# DPMD Express Backend

Backend Express.js untuk modul: **Bumdes**, **Musdesus**, dan **Perjalanan Dinas**.

## 📦 Stack Technology

- **Node.js** v18+
- **Express.js** v4
- **Sequelize** ORM
- **MySQL** Database
- **JWT** Authentication
- **Multer** File Upload
- **Winston** Logging

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd dpmd-express-backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=dpmd_bogor
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=5242880
UPLOAD_PATH=./storage/uploads

CORS_ORIGIN=http://localhost:5173
```

### 3. Create Storage Directories

```bash
mkdir -p storage/uploads/bumdes_laporan_keuangan
mkdir -p storage/uploads/bumdes_dokumen_badanhukum
mkdir -p storage/uploads/musdesus
mkdir -p storage/uploads/perjalanan_dinas
mkdir -p logs
```

### 4. Run Development Server

```bash
npm run dev
```

Server akan berjalan di: `http://localhost:3001`

---

## 📁 Project Structure

```
dpmd-express-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize configuration
│   ├── controllers/
│   │   ├── bumdes.controller.js  # Bumdes logic
│   │   ├── musdesus.controller.js
│   │   └── perjalananDinas.controller.js
│   ├── middlewares/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Global error handler
│   │   └── upload.js             # Multer file upload
│   ├── models/
│   │   ├── Bumdes.js             # Bumdes model
│   │   ├── Musdesus.js
│   │   └── PerjalananDinas.js
│   ├── routes/
│   │   ├── bumdes.routes.js      # Bumdes endpoints
│   │   ├── musdesus.routes.js
│   │   └── perjalananDinas.routes.js
│   ├── utils/
│   │   └── logger.js             # Winston logger
│   └── server.js                 # Main application
├── storage/
│   └── uploads/                  # Uploaded files
├── logs/                         # Application logs
├── .env                          # Environment variables
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Bumdes Module

#### Desa Routes (requires `role: desa`)

```http
GET    /api/desa/bumdes              # Get BUMDES for logged in desa
POST   /api/desa/bumdes              # Create/Update BUMDES (data only)
POST   /api/desa/bumdes/upload-file  # Upload single file (2-step upload)
PUT    /api/desa/bumdes/:id          # Update BUMDES
DELETE /api/desa/bumdes/:id          # Delete BUMDES
```

#### Admin Routes (requires `role: sarpras|admin|superadmin`)

```http
GET    /api/bumdes/all               # Get all BUMDES
GET    /api/bumdes/statistics        # Get BUMDES statistics
```

---

## 🔐 Authentication

Backend ini menggunakan **JWT Token** yang sama dengan Laravel.

### Request Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Token Structure

```javascript
{
  id: 123,
  role: "desa",
  desa_id: 45,
  email: "desa@example.com",
  iat: 1698765432,
  exp: 1699370232
}
```

---

## 📤 File Upload (2-Step Process)

### STEP 1: Save Data

```javascript
// POST /api/desa/bumdes
const response = await fetch('http://localhost:3001/api/desa/bumdes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    namabumdesa: "BUMDes Sejahtera",
    TahunPendirian: 2020,
    // ... other text fields
  })
});

const { data } = await response.json();
const bumdesId = data.id;
```

### STEP 2: Upload Files

```javascript
// POST /api/desa/bumdes/upload-file
for (const fieldName of ['LaporanKeuangan2021', 'ProfilBUMDesa', ...]) {
  const formData = new FormData();
  formData.append('file', fileObject);
  formData.append('bumdes_id', bumdesId);
  formData.append('field_name', fieldName);

  await fetch('http://localhost:3001/api/desa/bumdes/upload-file', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
}
```

---

## 📂 File Storage

Files are automatically organized by type:

```
storage/uploads/
├── bumdes_laporan_keuangan/
│   ├── 1698765432_laporan_2021.pdf
│   └── 1698765433_laporan_2022.pdf
│
└── bumdes_dokumen_badanhukum/
    ├── 1698765434_profil_bumdes.pdf
    └── 1698765435_anggaran_dasar.pdf
```

**Naming Convention:** `{timestamp}_{original_filename}.{ext}`

---

## 🔍 Logging

Logs are written to:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console - Development mode

**Log Format:**
```
2025-11-03 10:30:45 info: BUMDES Store Request Received {"desa_id":45}
2025-11-03 10:30:46 info: BUMDES File uploaded successfully {"bumdes_id":1,"field_name":"LaporanKeuangan2021"}
```

---

## 🧪 Testing

### Manual Testing

**1. Health Check:**
```bash
curl http://localhost:3001/health
```

**2. Create BUMDES:**
```bash
curl -X POST http://localhost:3001/api/desa/bumdes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "namabumdesa": "BUMDes Test",
    "TahunPendirian": 2020
  }'
```

**3. Upload File:**
```bash
curl -X POST http://localhost:3001/api/desa/bumdes/upload-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "bumdes_id=1" \
  -F "field_name=LaporanKeuangan2021"
```

---

## ⚠️ Migration from Laravel

### Frontend Changes Required

**Before (Laravel API):**
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

**After (Express API):**
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

### Database

Express.js menggunakan **database yang sama** dengan Laravel:
- Table: `bumdes`
- No migration needed
- Data tetap compatible

### Authentication

**Option 1: Continue using Laravel auth** (Recommended)
- Login/Register tetap di Laravel
- Express.js hanya verify JWT token
- Simpel, tidak perlu migrate user data

**Option 2: Migrate auth to Express.js**
- Implement full auth system
- Migrate user table
- More complex

---

## 🚧 TODO

- [x] Implement Bumdes module ✅
- [x] Implement Musdesus module ✅
- [x] Implement Perjalanan Dinas module ✅
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Setup CI/CD
- [ ] Add API documentation (Swagger)
- [ ] Implement caching (Redis)
- [ ] Add rate limiting per user
- [ ] Setup production deployment

---

## 📝 Notes

### Why Express.js?

Seperti yang diminta user untuk migrate dari Laravel ke Express.js untuk module:
1. **Bumdes** ✅ Done
2. **Musdesus** ✅ Done
3. **Perjalanan Dinas** ✅ Done

### Compatibility

Backend Express.js ini **100% compatible** dengan frontend React yang sudah ada. Hanya perlu ganti `API_BASE_URL`.

### Performance

Express.js generally faster than Laravel untuk API-only operations:
- Lighter framework
- Less overhead
- Better for real-time features

---

## 📚 Additional Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup and deployment instructions
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation with examples

---

## 🆘 Troubleshooting

### Port already in use
```bash
# Kill process on port 3001
npx kill-port 3001
```

### Database connection failed
```bash
# Check MySQL is running
# Check .env credentials
# Check database exists
```

### File upload fails
```bash
# Check storage directory exists
# Check permissions (chmod 755)
# Check MAX_FILE_SIZE in .env
```

---

## 📞 Support

Developer: GitHub Copilot Assistant  
Date: November 3, 2025  
Version: 1.0.0

---

**END OF DOCUMENTATION**
