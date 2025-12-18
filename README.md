# Aagman Gate Pass System - Backend

Node.js + Express + MongoDB backend for the Aagman Gate Pass Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `SMTP_*` - Email configuration (optional for development)

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## 📋 Environment Variables

### Required
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)

### Optional
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (comma-separated for multiple)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SKIP_EMAIL_VERIFICATION` - Skip email sending in development (true/false)

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── constants/       # Constants (departments, pass types, etc.)
│   ├── controllers/    # Route controllers
│   ├── db/             # Database connection
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app configuration
│   └── index.js         # Server entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
└── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/update-password` - Update password (authenticated)
- `GET /api/auth/me` - Get current user profile

### Users
- `POST /api/users/register` - Register student

### Passes
- `POST /api/passes` - Create gate pass (student)
- `GET /api/passes/my` - Get my passes (student)

### Department
- `GET /api/department/pending` - Get pending passes
- `PATCH /api/department/approve/:id` - Approve pass

### Academic
- `GET /api/academic/pending` - Get pending passes
- `PATCH /api/academic/approve/:id` - Approve pass

### Hostel Office
- `GET /api/hosteloffice/pending` - Get pending passes
- `PATCH /api/hosteloffice/approve/:id` - Approve pass

### Gate
- `POST /api/gate/scan` - Scan QR code

## 🚢 Deployment

### Render / Railway / AWS

1. **Set environment variables** in your hosting platform
2. **Set `NODE_ENV=production`**
3. **Configure `MONGO_URI`** (MongoDB Atlas recommended)
4. **Set `FRONTEND_URL`** to your frontend domain
5. **Deploy** - platform will run `npm start`

### VPS Deployment

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

4. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name aagman-backend
   pm2 save
   pm2 startup
   ```

5. **Set up Nginx reverse proxy** (optional)
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Security headers
- ✅ Input validation (Zod)
- ✅ Rate limiting ready
- ✅ Error handling without stack traces in production

## 📝 Notes

- Email verification is optional in development (set `SKIP_EMAIL_VERIFICATION=true`)
- In production, configure SMTP for email sending
- MongoDB Atlas is recommended for production
- Use environment variables for all sensitive data

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check `MONGO_URI` format
- Ensure MongoDB is running (local) or accessible (Atlas)
- Check firewall rules for Atlas

### Email Not Sending
- Verify SMTP credentials
- Check `SKIP_EMAIL_VERIFICATION` setting
- In development, OTP is logged to console if SMTP not configured

### CORS Errors
- Set `FRONTEND_URL` in `.env`
- In development, all origins are allowed
- In production, only `FRONTEND_URL` origins are allowed
