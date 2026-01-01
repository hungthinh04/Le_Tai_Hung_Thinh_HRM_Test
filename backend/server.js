const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// CORS middleware - Allow cross-origin requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// In-memory data storage
let employees = [];
let leaveRequests = [];

// Employee ID counter
let employeeIdCounter = 1;
let leaveIdCounter = 1;

// ========== EMPLOYEE ENDPOINTS ==========

// GET /employees - Return list of all employees
app.get("/employees", (req, res) => {
  res.status(200).json(employees);
});

// POST /employees - Add a new employee
app.post("/employees", (req, res) => {
  const { name, department, leaveBalance } = req.body;

  // Validation
  if (!name || !department || leaveBalance === undefined) {
    return res.status(400).json({
      error: "Missing required fields: name, department, leaveBalance",
    });
  }

  if (typeof leaveBalance !== "number" || leaveBalance < 0) {
    return res.status(400).json({
      error: "leaveBalance must be a non-negative number",
    });
  }

  const newEmployee = {
    id: employeeIdCounter++,
    name,
    department,
    leaveBalance,
  };

  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

// GET /employees/:id - Return a single employee by ID
app.get("/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const employee = employees.find((emp) => emp.id === id);

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  res.status(200).json(employee);
});

// DELETE /employees/:id - Delete an employee by ID
// Also delete all associated leave requests
app.delete("/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = employees.findIndex((emp) => emp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Employee not found" });
  }

  // Delete all leave requests associated with this employee
  leaveRequests = leaveRequests.filter((leave) => leave.employeeId !== id);

  employees.splice(index, 1);
  res.status(200).json({
    message:
      "Employee deleted successfully. Associated leave requests also deleted.",
  });
});

// ========== LEAVE REQUEST ENDPOINTS ==========

// POST /leave - Create a leave request
app.post("/leave", (req, res) => {
  const { employeeId, startDate, endDate, reason } = req.body;

  // Validation
  if (!employeeId || !startDate || !endDate || !reason) {
    return res.status(400).json({
      error: "Missing required fields: employeeId, startDate, endDate, reason",
    });
  }

  const employee = employees.find((emp) => emp.id === parseInt(employeeId));

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  // Date validation
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  const startDateObj = new Date(startDate);
  startDateObj.setHours(0, 0, 0, 0);

  const endDateObj = new Date(endDate);
  endDateObj.setHours(0, 0, 0, 0);

  if (startDateObj < today) {
    return res.status(400).json({
      error: "Start date cannot be in the past.",
    });
  }

  if (endDateObj < startDateObj) {
    return res.status(400).json({
      error: "End date cannot be before start date.",
    });
  }

  // Calculate duration in days (inclusive)
  const duration =
    Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

  // Check if employee has sufficient leave balance for the duration
  if (employee.leaveBalance < duration) {
    return res.status(400).json({
      error: `Insufficient leave balance. You need ${duration} days but only have ${employee.leaveBalance} days.`,
    });
  }

  // Check for overlapping leave dates with existing leave requests
  const hasOverlap = leaveRequests.some((leave) => {
    if (leave.employeeId !== parseInt(employeeId)) {
      return false; // Only check same employee's leave requests
    }

    const existingStart = new Date(leave.startDate);
    const existingEnd = new Date(leave.endDate);

    // Check if dates overlap
    return (
      (startDateObj >= existingStart && startDateObj <= existingEnd) ||
      (endDateObj >= existingStart && endDateObj <= existingEnd) ||
      (startDateObj <= existingStart && endDateObj >= existingEnd)
    );
  });

  if (hasOverlap) {
    return res.status(400).json({
      error: "Leave dates overlap with an existing leave request.",
    });
  }

  // Balance will be deducted when leave request is approved

  const newLeaveRequest = {
    id: leaveIdCounter++,
    employeeId: parseInt(employeeId),
    startDate,
    endDate,
    reason,
    status: "pending", // Default status
    duration: duration, // Store duration for later use
  };

  leaveRequests.push(newLeaveRequest);
  res.status(201).json(newLeaveRequest);
});

// GET /leave - List all leave requests
app.get("/leave", (req, res) => {
  res.status(200).json(leaveRequests);
});

// DELETE /leave/:id - Delete a leave request by ID
// If approved, restore the leaveBalance to the employee
app.delete("/leave/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = leaveRequests.findIndex((leave) => leave.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Leave request not found" });
  }

  const leaveRequest = leaveRequests[index];

  // If leave request is approved, restore leaveBalance to employee
  if (leaveRequest.status === "approved") {
    const employee = employees.find(
      (emp) => emp.id === leaveRequest.employeeId
    );
    if (employee) {
      // Restore balance based on duration
      const duration = leaveRequest.duration || 1;
      employee.leaveBalance += duration;
    }
  }

  leaveRequests.splice(index, 1);
  res.status(200).json({ message: "Leave request deleted successfully" });
});

// BONUS: PATCH /leave/:id/approve - Mark a leave request as approved
// Deduct leave balance from employee when approved
app.patch("/leave/:id/approve", (req, res) => {
  const id = parseInt(req.params.id);
  const leaveRequest = leaveRequests.find((leave) => leave.id === id);

  if (!leaveRequest) {
    return res.status(404).json({ error: "Leave request not found" });
  }

  if (leaveRequest.status === "approved") {
    return res.status(400).json({ error: "Leave request already approved" });
  }

  // Find employee and deduct balance
  const employee = employees.find((emp) => emp.id === leaveRequest.employeeId);

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  // Calculate duration if not stored
  const duration = leaveRequest.duration || 1;

  if (employee.leaveBalance < duration) {
    return res.status(400).json({
      error: `Insufficient leave balance. Need ${duration} days but only have ${employee.leaveBalance} days.`,
    });
  }

  // Deduct leave balance based on duration
  employee.leaveBalance -= duration;

  // Mark as approved
  leaveRequest.status = "approved";

  res.status(200).json(leaveRequest);
});

// Serve frontend files (must be after API routes)
app.use(express.static(path.join(__dirname, "../frontend")));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
