# HRM Labs - Human Resource Management System

A comprehensive employee and leave management system with a robust REST API backend and an interactive frontend interface.

## Quick Start

### How to Run Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies and start the server:

   ```bash
   npm install && npm start
   ```

   The server will run on `http://localhost:3000`

### How to Open Frontend

Simply open the `frontend/index.html` file in your web browser.

Alternatively, if the backend is running, navigate to `http://localhost:3000` in your browser (the backend automatically serves the frontend files).

---

## Features

### Backend Features

#### Employee Management

-  Create employees with name, department, and leave balance
-  View all employees or specific employee details
-  Delete employees (cascades to delete associated leave requests)
-  Input validation for all fields

#### Leave Request Management

-  Create leave requests with automatic duration calculation
-  Check for overlapping leave dates (prevent conflicts)
-  Validate leave balance before creating requests
-  Approve leave requests with automatic balance deduction
-  Delete leave requests with automatic balance restoration (if approved)
-  Track leave request status (pending/approved)

#### Smart Balance Management

-  **Balance calculation based on duration** - Trừ balance theo số ngày nghỉ, không phải chỉ -1
-  **Duration calculation (inclusive)** - Từ 01/02 → 05/02 = 5 ngày
-  Balance deduction only happens when request is **approved**
-  Balance restoration when deleting approved requests
-  Automatic validation of sufficient balance

#### Data Validation

-  Date validation (cannot create leave requests in the past)
-  Date range validation (end date must be >= start date)
-  Leave balance validation (must have enough days)
-  Overlapping date detection (same employee cannot have overlapping leaves)
-  Employee existence validation

### Frontend Features

#### User Interface

-  Clean, modern design with gradient background
-  Tab-based navigation (Employees / Leave Requests)
-  Responsive tables with detailed information
-  Form-based data entry
-  Success/error message notifications

#### Search & Filter

-  **Real-time search** for employees (by name or department)
-  **Real-time search** for leave requests (by employee ID, reason, or status)
-  Search filters work instantly as you type

#### Sorting

-  **Sort employees** by: Name, Department, Leave Balance
-  **Sort leave requests** by: Employee ID, Start Date, End Date, Reason, Status
-  Toggle ascending/descending with click icon (⇅)
-  Visual indicator showing sortable columns

#### Form Management

-  Form validation with user-friendly error messages
-  Form resets on successful submission
-  Form data preserved when validation fails (for correction)
-  Auto-reset when navigating to add pages
-  Date input validation (prevent past dates for leave requests)

#### Data Management

-  View detailed employee information
-  View detailed leave request information
-  Delete employees (with confirmation)
-  Delete leave requests (with confirmation)
-  Approve leave requests (with balance deduction)
-  Automatic UI refresh after operations

---

## API Documentation

### Base URL

```
http://localhost:3000
```

### Employee Endpoints

**Get all employees**

```
GET /employees
```

**Get single employee**

```
GET /employees/:id
```

**Create new employee**

```
POST /employees
Content-Type: application/json

{
  "name": "John Doe",
  "department": "Engineering",
  "leaveBalance": 15
}
```

**Delete employee** (also deletes associated leave requests)

```
DELETE /employees/:id
```

---

### Leave Request Endpoints

**Get all leave requests**

```
GET /leave
```

**Create leave request**

```
POST /leave
Content-Type: application/json

{
  "employeeId": 1,
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "reason": "Vacation"
}
```

Response includes `duration` field (number of days).

**Delete leave request**

```
DELETE /leave/:id
```

- If request was **approved**: restores balance to employee
- If request was **pending**: no balance change

**Approve leave request**

```
PATCH /leave/:id/approve
```

- Changes status from `pending` to `approved`
- Deducts balance from employee based on duration
- Fails if insufficient balance

---

## Business Logic Details

### Leave Balance Deduction

- Balance is **NOT deducted** when creating a leave request (status = pending)
- Balance is **deducted when request is approved** (status = approved)
- Deduction amount = duration of leave in days (inclusive)
- Deletion of approved requests **restores** the balance

### Overlapping Date Prevention

- System prevents creating leave requests with overlapping dates
- Only checks against OTHER pending/approved requests for the SAME employee
- Dates are compared inclusively

### Cascading Deletion

- Deleting an employee automatically deletes all their leave requests
- Approved leave request balances are NOT restored in this case

### Form Behavior

- **On error**: Form data is preserved for user correction
- **On success**: Form is cleared and user is redirected
- **On navigation**: Form auto-resets when opening "Add" pages

---

## Project Structure

```
HRMLabs/
├── README.md
├── backend/
│   ├── package.json
│   └── server.js              # Express API server with all endpoints
├── frontend/
│   ├── index.html             # HTML structure with forms and tables
│   ├── script.js              # JavaScript logic (fetch, search, sort, etc.)
│   └── styles.css             # Styling and responsive design
```

---

## Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Data Storage**: In-memory (resets on server restart)
- **API**: RESTful API with CORS enabled

---

## Example Workflow

1. **Add Employee**

   - Click "+ Add Employee"
   - Fill in name, department, leave balance
   - Click Submit

2. **Create Leave Request**

   - Click "+ Add Leave Request"
   - Select employee from dropdown
   - Choose start and end dates
   - Enter reason
   - Click Submit (creates request with status = pending)

3. **Approve Leave Request**

   - Go to "All Leave Requests" tab
   - Find the pending request
   - Click "View Detail"
   - Click "Approve" button
   - Balance is deducted automatically

4. **Search and Sort**
   - Use search box to filter data in real-time
   - Click column headers to sort (click again to reverse)
   - Search and sort can be combined

---

##  Validation & Error Handling

- Comprehensive input validation on both frontend and backend
- User-friendly error messages for all validation failures
- Automatic form clearing on successful submission
- Confirmation dialogs for destructive operations
- Real-time feedback with success/error notifications

---

## Notes

- All data is stored in-memory and will be lost when the server restarts
- CORS is enabled for cross-origin requests
- Dates must be in `YYYY-MM-DD` format
- Leave balance must be a non-negative number
- All employee names and departments are required fields
