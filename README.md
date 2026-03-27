# Software Requirements Specification (SRS)

## Project Title

**Vehicle Management System**

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for the Vehicle Management System. The system is intended for vehicle workshops, garages, and service centers to manage vehicle records, service operations, job cards, billing, spare parts, batteries, and user access through a centralized web application.

### 1.2 Scope

The Vehicle Management System is a full-stack web application with:

- a React-based frontend for workshop staff and administrators
- a Node.js and Express backend for business logic and REST APIs
- a MySQL or MariaDB database for persistent data storage

The system supports:

- secure login and logout
- role-based access control
- vehicle registration and maintenance tracking
- service and job card management
- billing and invoice record creation
- spare parts inventory management
- battery inventory management
- admin user management and activity monitoring

### 1.3 Intended Audience

This SRS is intended for:

- project guides and evaluators
- developers and testers
- system administrators
- workshop owners or operators

### 1.4 Definitions

- `Vehicle`: customer vehicle registered in the system
- `Service Record`: maintenance or repair entry linked to a vehicle
- `Job Card`: workshop task sheet containing job details for a vehicle
- `Bill`: invoice-style record generated for work performed
- `Super Admin`: highest privileged user with full system control
- `Admin`: operational manager with limited administrative access
- `Staff`: workshop user handling day-to-day operations

## 2. Overall Description

### 2.1 Product Perspective

The Vehicle Management System is a standalone web-based application. It uses a client-server architecture:

- frontend: React application
- backend: Express REST API
- database: MySQL or MariaDB

### 2.2 Product Objectives

The main objectives of the system are:

- to digitize workshop vehicle and service records
- to reduce manual paperwork in service operations
- to improve user accountability with login-based access
- to track inventory items such as spare parts and batteries
- to support better operational decisions through dashboard views

### 2.3 User Classes

#### Super Admin

- can manage all system modules
- can create users
- can reset passwords
- can change user roles
- can activate or deactivate users
- can view operational and activity data

#### Admin

- can access dashboards and operational modules
- can view admin user information
- can monitor staff usage and activity
- cannot create new users or change privileged settings in the current implementation rules

#### Staff

- can access daily working modules
- can manage vehicles, services, and job cards
- can view a simplified dashboard
- cannot access admin user controls

### 2.4 Operating Environment

- operating system: Windows, Linux, or macOS
- frontend runtime: modern web browser
- backend runtime: Node.js
- database server: MySQL or MariaDB
- local development ports:
  - frontend: `3000`
  - backend: `5000`

### 2.5 Assumptions and Dependencies

- Node.js and npm are installed
- MySQL or MariaDB server is available
- database schema for core workshop tables is present
- internet access may be required for map links or deployment environments
- JWT secret and database credentials are configured correctly in environment variables

## 3. Functional Requirements

### 3.1 Authentication and Authorization

#### FR-1 Login

The system shall allow registered users to log in using username and password.

#### FR-2 JWT Authentication

The system shall generate an authenticated session token after successful login.

#### FR-3 Logout

The system shall allow authenticated users to log out and record logout activity.

#### FR-4 Role-Based Access

The system shall restrict features based on user roles: `super_admin`, `admin`, and `staff`.

#### FR-5 Active User Validation

The system shall prevent inactive users from logging into the system.

### 3.2 User and Role Management

#### FR-6 Default Role Setup

The system shall initialize required roles if they do not exist.

#### FR-7 Default Super Admin

The system shall create a default super admin account when no admin account exists.

#### FR-8 View Users

Authorized users shall be able to view the list of users with role and activity information.

#### FR-9 Create User

The super admin shall be able to create new admin or staff users.

#### FR-10 Update User Status

The super admin shall be able to activate or deactivate users.

#### FR-11 Change Role

The super admin shall be able to change a user's role.

#### FR-12 Reset Password

The super admin shall be able to reset user passwords.

### 3.3 Vehicle Management

#### FR-13 Add Vehicle

The system shall allow users to add a new vehicle with owner and registration details.

#### FR-14 View Vehicles

The system shall display a list of active vehicles.

#### FR-15 Update Vehicle

The system shall allow users to edit vehicle details.

#### FR-16 Soft Delete Vehicle

The system shall move deleted vehicles to a deleted list instead of permanently removing them.

#### FR-17 Restore Vehicle

The system shall allow users to restore soft-deleted vehicles.

#### FR-18 Search Vehicles

The system shall allow users to search vehicles by owner, model, or registration.

### 3.4 Service Management

#### FR-19 Create Service Record

The system shall allow users to create service entries linked to vehicles.

#### FR-20 View Service Records

The system shall display service records with related vehicle information.

#### FR-21 Update Service Record

The system shall allow users to modify service details.

#### FR-22 Delete Service Record

The system shall allow deletion or status-based removal of service entries as implemented.

#### FR-23 Filter Services

The system shall allow filtering of services by status and search terms.

#### FR-24 Service Status Tracking

The system shall maintain service status such as pending, in progress, or completed.

### 3.5 Service Master Management

#### FR-25 Service Catalog

The system shall maintain a service master list for predefined service types.

#### FR-26 Service Master CRUD

The system shall support create, read, update, and delete operations for service master records.

### 3.6 Job Card Management

#### FR-27 Create Job Card

The system shall allow users to create a job card for a vehicle.

#### FR-28 View Job Cards

The system shall display all recorded job cards.

#### FR-29 Update Job Card

The system shall allow users to update job card details.

#### FR-30 Delete Job Card

The system shall allow users to delete job cards.

### 3.7 Billing Management

#### FR-31 Create Bill

The system shall allow users to create a bill linked to a vehicle and optional job card.

#### FR-32 View Bills

The system shall display stored billing records.

#### FR-33 Bill Calculation Support

The system shall store bill amount and related customer or vehicle details for invoice use.

### 3.8 Spare Parts Inventory

#### FR-34 Add Spare Part

The system shall allow users to add spare parts with stock, category, supplier, and price details.

#### FR-35 View Spare Parts

The system shall display available spare parts inventory.

#### FR-36 Update Spare Part

The system shall allow users to edit spare part data.

#### FR-37 Delete Spare Part

The system shall allow users to delete spare part records.

#### FR-38 Low Stock Awareness

The system should help users identify low-stock inventory items.

### 3.9 Battery Inventory

#### FR-39 Add Battery

The system shall allow users to add battery inventory records.

#### FR-40 View Batteries

The system shall display battery stock records.

#### FR-41 Update Battery

The system shall allow users to edit battery details.

#### FR-42 Delete Battery

The system shall allow users to delete battery records.

#### FR-43 Battery Warranty and Stock Tracking

The system shall store battery-specific details such as stock quantity and warranty-related information.

### 3.10 Dashboard and Monitoring

#### FR-44 Dashboard Access

The system shall provide dashboard views after login.

#### FR-45 Role-Specific Dashboards

The system shall display different dashboard experiences for super admin, admin, and staff users.

#### FR-46 Activity Summary

The system shall provide summary data such as user counts, login counts, logout counts, and recent activity.

#### FR-47 Operational Overview

The dashboard shall show counts and summaries for vehicles, services, job cards, spare parts, and batteries.

## 4. External Interface Requirements

### 4.1 User Interface Requirements

The user interface shall:

- provide a login page
- provide navigation for available modules
- display protected routes only for authorized users
- support desktop and mobile-responsive layouts
- show status messages for create, update, delete, and error actions

Processor: Intel Core i3 or equivalent
RAM: 4 GB minimum, 8 GB recommended
Storage: 10 GB free disk space
Display: 1366 x 768 resolution or higher
Keyboard and Mouse: Standard input devices
Network: LAN/Wi-Fi connection for client-server communication

### 4.2 Software Interface Requirements

The system shall interact with:

- REST APIs exposed by the Express backend
- MySQL or MariaDB database
- browser local storage for client-side token and user session data

### 4.3 Communication Interfaces

- frontend and backend communication shall use HTTP/HTTPS
- data exchange format shall be JSON

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

- the system should respond to normal user actions within acceptable time under regular workshop usage
- dashboard and list pages should load efficiently for common data volumes

### 5.2 Security Requirements

- passwords shall be stored in hashed form
- authenticated access shall use JWT tokens
- restricted pages shall not be accessible without valid login
- role-protected features shall be available only to authorized users
- sensitive configuration values should be stored in environment variables

### 5.3 Reliability Requirements

- the system should preserve stored records accurately
- the backend should return meaningful error responses for failed operations
- soft deletion shall protect vehicle data from accidental permanent removal

### 5.4 Maintainability Requirements

- the codebase should remain modular enough for future extension
- configuration should be separated from source code using environment variables
- API endpoints and UI modules should support future enhancement such as automated testing and route modularization

### 5.5 Usability Requirements

- the system shall be easy to operate for workshop staff with basic computer knowledge
- forms shall use understandable labels and feedback messages
- dashboard pages should summarize operational status clearly

### 5.6 Portability Requirements

- the application should run on standard modern browsers
- the backend should run on any platform supported by Node.js

## 6. Data Requirements

The system shall maintain data for:

- users
- roles
- vehicles
- services
- service master records
- job cards
- bills
- spare parts
- batteries
- login and logout activity

### 6.1 Core Entities

#### Users

- user id
- name
- username
- email
- password hash
- role
- active status
- login count
- last login time
- logout count
- last logout time

#### Vehicles

- vehicle id
- model
- owner
- registration number
- deletion status

#### Services

- service id
- vehicle reference
- service details
- status
- amount or cost-related fields

#### Job Cards

- job id
- vehicle reference
- job description and dates

#### Bills

- bill id
- vehicle reference
- job card reference
- billing amount
- customer and invoice-related information

#### Spare Parts

- part id
- part name
- part number
- category
- stock quantity
- unit price
- supplier

#### Batteries

- battery id
- battery name or model
- stock quantity
- price
- warranty or related metadata

## 7. Constraints

- the project currently depends on a MySQL or MariaDB backend
- several modules expect predefined database tables to exist
- frontend and backend are currently developed as separate applications
- some frontend components currently call the backend using direct localhost API URLs

## 8. Future Enhancement Requirements

The following enhancements may be considered in later versions:

- automated unit and integration tests
- centralized API service usage across all frontend modules
- database migration scripts for all tables
- stronger session invalidation and refresh token support
- advanced reporting and export features
- audit trail for sensitive admin actions
- improved backend modularization into routes, controllers, and services

## 9. Summary

The Vehicle Management System is designed to computerize the main operations of a vehicle workshop. It provides role-based login, vehicle and service management, job card handling, billing support, inventory tracking, and user administration in one integrated platform. This SRS can be used as the formal project requirement document for academic submission, development reference, and future system enhancement planning.

Frontend: React.js, Bootstrap, Tailwind CSS, React Router
Backend: Node.js, Express.js
Database: MySQL / MariaDB
API Communication: REST APIs with Axios
Authentication: JWT-based authentication
Version Control: Git and GitHub
Development Tools: npm, Visual Studio Code

Actors
User
Admin
Staff
User Actions
Log in to the system
View dashboard summary
Add vehicle details
View vehicle records
View service history
Create and update service records
Create and manage job cards
Navigate through system modules
Staff Actions
Log in to the system
Manage vehicles
Manage service operations
Create and update job cards
View assigned or recent workshop records
Access the staff dashboard
Admin Actions
Manage user accounts
Monitor dashboard activity
Manage vehicle data
Manage service and job card records
View inventory modules
Maintain spare parts and battery records
Supervise workshop operations
Activity Diagram (Description)
The user opens the Vehicle Management System in a web browser.
The login page or homepage is displayed.
The user enters valid login credentials.
The system verifies the credentials from the server and database.
After successful login, the dashboard is displayed based on the user role.
The user navigates to modules such as Vehicles, Services, Job Cards, Spare Parts, or Batteries.
The user enters, updates, or views required information.
The system processes the request and stores or retrieves data from the database.
Updated records and current status are displayed on the screen.
The user logs out after completing the operations.
5. Structural Models (UML)
Class Diagram (Description)
The class diagram represents the static structure of the Vehicle Management System by showing major classes, attributes, and relationships.

Classes Used in the System
User
userID
username
password
role
createdAt
Vehicle
vehicleID
ownerName
vehicleNumber
model
manufacturer
contactNumber
createdAt
Service
serviceID
vehicleID
serviceType
serviceDate
cost
status
JobCard
jobCardID
vehicleID
complaint
workDescription
status
createdAt
Admin
adminID
username
password
role
SparePart
partID
partName
partNumber
stockQty
price
Battery
batteryID
batteryName
batteryCode
stockQty
price
Relationships
A User logs in and accesses system modules based on role.
A Vehicle can have multiple Service records.
A Vehicle can have multiple Job Cards.
Admin manages users, vehicles, services, job cards, and inventory.
SparePart and Battery are inventory-related entities managed by Admin or authorized Staff.
+----------------------+
| User                 |
+----------------------+
| userID               |
| username             |
| password             |
| role                 |
| createdAt            |
+----------------------+

          |
          | accesses
          v

+----------------------+
| Vehicle              |
+----------------------+
| vehicleID            |
| ownerName            |
| vehicleNumber        |
| model                |
| manufacturer         |
| contactNumber        |
| createdAt            |
+----------------------+
     |              |
     | has          | has
     v              v

+----------------------+     +----------------------+
| Service              |     | JobCard              |
+----------------------+     +----------------------+
| serviceID            |     | jobCardID            |
| vehicleID            |     | vehicleID            |
| serviceType          |     | complaint            |
| serviceDate          |     | workDescription      |
| cost                 |     | status               |
| status               |     | createdAt            |
+----------------------+     +----------------------+

          ^
          |
          | manages
+----------------------+
| Admin                |
+----------------------+
| adminID              |
| username             |
| password             |
| role                 |
+----------------------+

Admin also manages:

+----------------------+     +----------------------+
| SparePart            |     | Battery              |
+----------------------+     +----------------------+
| partID               |     | batteryID            |
| partName             |     | batteryName          |
| partNumber           |     | batteryCode          |
| stockQty             |     | stockQty             |
| price                |     | price                |
+----------------------+     +----------------------+
6. Behavioral Models (UML)
Sequence Diagram (Description)
The sequence diagram shows interaction between the user, frontend, backend server, and database.

Sequence Flow
The user sends a request to access the Vehicle Management System.
The frontend interface receives user input.
The request is sent to the Node.js and Express server.
The server validates the request and communicates with the MySQL or MariaDB database.
The database returns the required records.
The server sends the processed response back to the frontend.
The frontend displays the result to the user.
Object Diagram
Objects represent real instances of classes in the system.

User Object
Vehicle Object
Service Object
JobCard Object
Admin Object
+----------------------+
| User Object          |
+----------------------+
| userID = U101        |
| username = staff1    |
| role = staff         |
+----------------------+
           |
           | manages
           v
+----------------------+
| Vehicle Object       |
+----------------------+
| vehicleID = V201     |
| ownerName = Rahul    |
| vehicleNumber = MH12AB1234 |
| model = Honda City   |
+----------------------+
           |
           | has
           v
+----------------------+
| Service Object       |
+----------------------+
| serviceID = S301     |
| serviceType = Oil Change |
| serviceDate = 10/02/2026 |
| status = Completed   |
+----------------------+

+----------------------+
| Admin Object         |
+----------------------+
| adminID = ADM01      |
| username = admin     |
| role = admin         |
+----------------------+
State Transition Diagram
The state transition diagram describes the major system states.

States Include
Initial State
Homepage Display
Login Page
Dashboard Display
Vehicle Module Open
Service Module Open
Job Card Module Open
Inventory Module Open
Record Submission or Update
Logout State
End State
Component Diagram
The component diagram represents the overall architecture of the Vehicle Management System.

Frontend Layer
React.js for user interface
React Router for navigation
Bootstrap and Tailwind CSS for styling
Axios for API communication
Backend Layer
Node.js as runtime environment
Express.js for REST APIs and route handling
JWT authentication for access control
Database Layer
MySQL or MariaDB for persistent storage
Stores users, vehicles, services, job cards, spare parts, batteries, and activity data
Deployment Diagram
Client Browser
      |
      v
React Frontend Application
      |
      v
Node.js / Express Application Server
      |
      v
MySQL / MariaDB Database Server
Final Implementation Table Design
User Table
user_id
username
password
role
created_at
Vehicle Table
vehicle_id
owner_name
vehicle_number
model
manufacturer
contact_number
created_at
Service Table
service_id
vehicle_id
service_type
service_date
cost
status
Job Card Table
job_card_id
vehicle_id
complaint
work_description
status
created_at
Spare Parts Table
part_id
part_name
part_number
stock_qty
price
Battery Table
battery_id
battery_name
battery_code
stock_qty
price
Data Dictionary
user_id - Unique identifier for each user
username - Login name of the user
password - Encrypted password of the user
role - User role such as admin or staff
vehicle_id - Unique identifier for each vehicle
owner_name - Name of the vehicle owner
vehicle_number - Vehicle registration number
model - Model of the vehicle
manufacturer - Manufacturer or brand of the vehicle
contact_number - Contact number of vehicle owner
service_id - Unique identifier for each service record
service_type - Type of service performed
service_date - Date of servicing
cost - Service cost amount
status - Current status of service or job card
job_card_id - Unique identifier for each job card
complaint - Customer complaint details
work_description - Description of work performed
Menu Structure
Home
Login
Dashboard
Vehicles
Services
Job Cards
Spare Parts
Batteries
Reports
Admin
Website Map
Home
├ Login
├ Dashboard
├ Vehicles
├ Services
├ Job Cards
├ Spare Parts
├ Batteries
├ Reports
└ Admin
List of Screens
Homepage
Login Page
Dashboard
Vehicle Management Page
Service Operations Page
Job Cards Page
Spare Parts Page
Batteries Page
Reports Page
Admin Users Page
Test Cases
Test Case 1
Verify that the login page accepts valid credentials and redirects the user to the correct dashboard.

Test Case 2
Verify that vehicle records can be added, viewed, edited, and deleted correctly.

Test Case 3
Verify that service records are displayed and updated properly.

Test Case 4
Verify that job cards can be created and managed successfully.

Test Case 5
Verify that navigation links such as Dashboard, Vehicles, Services, Job Cards, and Inventory modules work correctly.

Test Case 6
Verify that admin users can access admin features and staff users cannot access restricted pages.

Test Plan
Testing will be conducted to ensure the functionality, usability, security, and performance of the Vehicle Management System.

The testing process will include:

verifying login and logout functionality
checking role-based access control
testing vehicle entry, update, and deletion
testing service and job card management
testing spare parts and battery inventory operations
verifying dashboard data display
checking responsiveness across multiple screen sizes
validating API and database integration
User Manual
Open a web browser such as Google Chrome.
Enter the Vehicle Management System URL.
The homepage or login page will appear.
Log in using valid username and password.
After login, the dashboard will open according to the user role.
Use the navigation menu to access Vehicles, Services, Job Cards, Spare Parts, Batteries, Reports, or Admin.
Add, update, or view records as required.
Review stored information from the dashboard or module pages.
Log out after completing the work.