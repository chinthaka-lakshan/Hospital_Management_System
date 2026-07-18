# Hospital Management System

This is a web application with a Laravel backend and a React (Vite) frontend.

## Prerequisites
- PHP 8.x
- Composer
- Node.js & npm
- MySQL (XAMPP / Laragon etc.)

## Local Setup Instructions for Windows/Mac

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Backend Setup (Laravel)
Open a terminal and navigate into the `backend` folder:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

#### Database Configuration
1. Open your MySQL client (e.g., phpMyAdmin via XAMPP) and create a database named `hospital_management`.
2. Open the `backend/.env` file and update your database credentials to match your local setup. If you are using XAMPP on Windows, the password is usually blank:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=hospital_management
   DB_USERNAME=root
   DB_PASSWORD=
   ```

#### Migrate and Seed the Database
Run the following command to create the tables and insert the default users (including the Admin user):
```bash
php artisan migrate:fresh --seed
```

Start the backend server:
```bash
php artisan serve
```
*The API will now be running at `http://127.0.0.1:8000`.*

### 3. Frontend Setup (React/Vite)
Open a **new** terminal window and navigate into the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will now be running. Check the terminal for the exact localhost URL (usually `http://localhost:5173`).*

### 4. Default Login Credentials
If you seeded the database correctly, you can use the following default credentials to log in:
- **Admin**: `admin@gmail.com` / `password`
- **Doctor**: `doctor@gmail.com` / `password`
- **Receptionist**: `reception@gmail.com` / `password`
