# Deployment Guide

## Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set:
   - Framework Preset: `Create React App`
   - Root Directory: `vehicle-management-client`
3. Add environment variable:
   - `REACT_APP_API_URL=https://your-railway-backend-url`
4. Deploy or redeploy.

## Backend on Railway

1. Create a Railway project.
2. Add a GitHub service using:
   - Root Directory: `vehicle-management-server`
3. Add a MySQL service in the same Railway project.
4. In the backend service, add these variables:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_PORT`
   - `PORT=5000`
   - `FRONTEND_URL=https://your-vercel-url`
   - `JWT_SECRET=your-strong-secret`
5. Expose the backend service publicly on port `5000`.

## Railway Variable Mapping

Use the values from the Railway MySQL service:

- `DB_HOST` <- `MYSQLHOST`
- `DB_USER` <- `MYSQLUSER`
- `DB_PASSWORD` <- `MYSQLPASSWORD`
- `DB_NAME` <- `MYSQLDATABASE`
- `DB_PORT` <- `MYSQLPORT`

## Default Login

If the backend connects successfully and seeds auth data:

- Username: `admin`
- Password: `admin123`
