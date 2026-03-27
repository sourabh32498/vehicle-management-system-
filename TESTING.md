# Vehicle Management System Testing Guide

This file gives a simple manual testing checklist for the project.

## Start The Project

## Database Setup

This project should use a password-based MariaDB or MySQL user for the backend.

Do not use a Windows-integrated `root` account if it is configured with `auth_gssapi_client`, because the Node `mysql2` driver cannot use that authentication plugin.

Example MariaDB setup:

```sql
CREATE DATABASE IF NOT EXISTS vehicle_db;
CREATE USER 'vehicle_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vehicle_db.* TO 'vehicle_app'@'localhost';
FLUSH PRIVILEGES;
```

Recommended backend `.env` values:

```env
DB_HOST=localhost
DB_USER=vehicle_app
DB_PASSWORD=your_password
DB_NAME=vehicle_db
DB_PORT=3309
PORT=5000
```

### Backend

Open a terminal in `vehicle-management-server` and run:

```powershell
node server.js
```

### Frontend

Open another terminal in `vehicle-management-client` and run:

```powershell
npm.cmd start
```

Open the app in your browser:

```text
http://localhost:3000
```

## Default Login

Use the default seeded main account:

- Username: `admin`
- Password: `admin123`

This account is a `super_admin`.

## Manual Testing Checklist

### 1. Home Page

- Open `/`
- Confirm the homepage loads correctly
- Confirm the opening animation is visible
- Confirm `Enter Workspace` works
- Confirm `About Us` scrolls or navigates properly
- Confirm inventory preview loads without layout issues

### 2. Login

- Open the login page
- Login with `admin` / `admin123`
- Confirm redirect to dashboard after success
- Try wrong username or password
- Confirm an error message appears

### 3. Dashboard

- Confirm dashboard opens after login
- Confirm cards, data blocks, and navigation display properly
- Confirm no broken layout on desktop or mobile width

### 4. Vehicles

- Add a vehicle
- Edit the vehicle
- Delete the vehicle
- Confirm the record updates correctly
- If deleted vehicle list exists, confirm deleted record appears there

### 5. Service List

- Add a service record
- Edit a service record
- Confirm the new record appears in the service list
- Confirm values are saved correctly

### 6. Job Cards

- Create a job card
- View the saved job card
- Confirm the job card information is correct

### 7. Spare Parts

- Add a spare part
- Edit the spare part
- Confirm stock quantity is shown correctly
- Confirm unit price is shown correctly
- Confirm parts appear on the homepage inventory preview if expected

### 8. Batteries

- Add a battery item
- Edit a battery item
- Confirm the battery section displays saved values correctly

### 9. Admin Users

Login as `super_admin` and open `/admin/users`.

- Confirm the user list loads
- Confirm available roles load
- Create a new `admin` user
- Create a new `staff` user
- Change a user's role
- Deactivate a user
- Reactivate a user
- Reset a user's password

### 10. Admin Role Test

Login with a user whose role is `admin`.

- Confirm the user can access normal protected pages
- Confirm the user can open the Admin Users page
- Confirm the user can view users and roles
- Confirm the user cannot create users
- Confirm the user cannot change roles
- Confirm the user cannot deactivate or reactivate users
- Confirm the user cannot reset passwords

### 11. Staff Role Test

Login with a user whose role is `staff`.

- Confirm the user can access normal work pages if allowed
- Confirm the user cannot access `/admin/users`
- Try opening `/admin/users` manually in the browser
- Confirm access is denied or redirected

### 12. Logout And Protected Routes

- Logout from the app
- Try opening protected pages directly
- Confirm redirect to login
- Remove auth data from local storage and refresh
- Confirm login is required again

### 13. Validation And Error Handling

- Submit empty forms
- Confirm validation messages appear
- Enter invalid values where possible
- Confirm errors are handled correctly
- Stop backend temporarily and test frontend error messages

### 14. Database Check

Check MySQL after creating or updating records.

- Confirm users are saved correctly
- Confirm vehicles are saved correctly
- Confirm parts and batteries are saved correctly
- Confirm role changes and account status changes are saved

### 15. Restart Check

- Stop frontend and backend
- Start them again
- Login again
- Confirm saved data still exists

## Suggested Test Order

Use this order for easiest testing:

1. Login as `super_admin`
2. Test vehicles, services, job cards, parts, and batteries
3. Create one `admin` user
4. Create one `staff` user
5. Test the `admin` account
6. Test the `staff` account
7. Test logout and direct URL access

## Notes

- The backend seeds a default `super_admin` account if it does not already exist.
- The local MariaDB instance on this machine uses port `3309`, not `3306`.
- If you see `auth_gssapi_client` or `AUTH_SWITCH_PLUGIN_ERROR`, switch the backend to a password-based DB user such as `vehicle_app`.
- If login fails for the default account, check backend setup and the admin reset script in `vehicle-management-server/scripts/reset-admin.js`.
