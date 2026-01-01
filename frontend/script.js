const API_BASE_URL = "http://localhost:3000";

// Message display function
function showMessage(text, type = "success") {
  const messageEl = document.getElementById("message");
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = "block";

  setTimeout(() => {
    messageEl.style.display = "none";
  }, 3000);
}

// ========== PAGE NAVIGATION ==========

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  // Update nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Update active nav button for list pages
  if (pageId === "employees-list") {
    document
      .querySelector('[data-page="employees-list"]')
      .classList.add("active");
    loadEmployees(false);
  } else if (pageId === "leave-list") {
    document.querySelector('[data-page="leave-list"]').classList.add("active");
    loadLeaveRequests(false);
  } else if (pageId === "add-leave") {
    // Load employees into dropdown when opening add leave page
    loadEmployeesForDropdown();
    // Reset form when opening add leave page
    document.getElementById("leaveForm").reset();
  } else if (pageId === "add-employee") {
    // Reset form when opening add employee page
    document.getElementById("employeeForm").reset();
  }
}

// Navigation menu event listeners
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pageId = btn.getAttribute("data-page");
    showPage(pageId);
  });
});

// Initialize: Show employees list by default
document.addEventListener("DOMContentLoaded", () => {
  showPage("employees-list");

  // Set minimum date for startDate (today)
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  if (startDateInput && endDateInput) {
    const today = new Date().toISOString().split("T")[0];
    startDateInput.setAttribute("min", today);
    endDateInput.setAttribute("min", today);

    // Update endDate min when startDate changes
    startDateInput.addEventListener("change", () => {
      const startDate = startDateInput.value;
      if (startDate) {
        endDateInput.setAttribute("min", startDate);
        // If endDate is before startDate, clear it
        if (endDateInput.value && endDateInput.value < startDate) {
          endDateInput.value = "";
        }
      }
    });
  }
});

// ========== EMPLOYEE FUNCTIONS ==========

// Load all employees
async function loadEmployees(showMessageOnLoad = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`);
    const employees = await response.json();

    const tableBody = document.getElementById("employeesTableBody");

    if (employees.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">No employees found</td></tr>';
    } else {
      tableBody.innerHTML = employees
        .map(
          (emp, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${emp.name}</td>
              <td>${emp.department}</td>
              <td>${emp.leaveBalance}</td>
              <td>
                <button class="btn-view" onclick="viewEmployeeDetail(${
                  emp.id
                })">
                  View Detail
                </button>
                <button class="btn-delete" onclick="deleteEmployee(${emp.id})">
                  Delete
                </button>
              </td>
            </tr>
          `
        )
        .join("");
    }

    if (showMessageOnLoad) {
      showMessage("Employees loaded successfully!", "success");
    }
  } catch (error) {
    showMessage("Error fetching employees: " + error.message, "error");
  }
}

// View employee detail
async function viewEmployeeDetail(employeeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`);
    const employee = await response.json();

    const detailContent = document.getElementById("employeeDetailContent");
    detailContent.innerHTML = `
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">${employee.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${employee.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Department:</span>
          <span class="detail-value">${employee.department}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Leave Balance:</span>
          <span class="detail-value">${employee.leaveBalance}</span>
        </div>
        <div class="detail-actions">
          <button class="btn-delete" onclick="deleteEmployee(${employee.id}, true)">
            Delete Employee
          </button>
        </div>
      </div>
    `;

    showPage("employee-detail");
  } catch (error) {
    showMessage("Error fetching employee details: " + error.message, "error");
  }
}

// Delete employee
async function deleteEmployee(employeeId, fromDetail = false) {
  if (!confirm("Are you sure you want to delete this employee?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(
        "Employee deleted successfully! Associated leave requests also deleted.",
        "success"
      );
      // Refresh both employees and leave requests lists
      loadEmployees(false);
      loadLeaveRequests(false);
      if (fromDetail) {
        showPage("employees-list");
      }
    } else {
      showMessage(data.error || "Error deleting employee", "error");
    }
  } catch (error) {
    showMessage("Network error: " + error.message, "error");
  }
}

// Handle Add Employee Form
document
  .getElementById("employeeForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById("name").value,
      department: document.getElementById("department").value,
      leaveBalance: parseInt(document.getElementById("leaveBalance").value),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage("Employee added successfully!", "success");
        // Only reset form on successful submission
        document.getElementById("employeeForm").reset();
        showPage("employees-list");
      } else {
        showMessage(data.error || "Error adding employee", "error");
        // Form data is preserved for user correction
      }
    } catch (error) {
      showMessage("Network error: " + error.message, "error");
      // Form data is preserved for user correction
    }
  });

// ========== LEAVE REQUEST FUNCTIONS ==========

// Load employees into dropdown for leave request form
// Show all existing employees
async function loadEmployeesForDropdown() {
  try {
    const employeesResponse = await fetch(`${API_BASE_URL}/employees`);
    const employees = await employeesResponse.json();

    const selectElement = document.getElementById("employeeId");

    // Clear existing options
    selectElement.innerHTML = '<option value="">-- Select Employee --</option>';

    if (employees.length === 0) {
      selectElement.innerHTML +=
        '<option value="" disabled>No employees available</option>';
    } else {
      employees.forEach((emp) => {
        const option = document.createElement("option");
        option.value = emp.id;
        option.textContent = `${emp.name} (ID: ${emp.id}) - ${emp.department} - Balance: ${emp.leaveBalance}`;
        selectElement.appendChild(option);
      });
    }
  } catch (error) {
    showMessage("Error loading employees: " + error.message, "error");
  }
}

// Load all leave requests
async function loadLeaveRequests(showMessageOnLoad = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/leave`);
    const leaveRequests = await response.json();

    const tableBody = document.getElementById("leaveTableBody");

    if (leaveRequests.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">No leave requests found</td></tr>';
    } else {
      tableBody.innerHTML = leaveRequests
        .map(
          (leave, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${leave.employeeId}</td>
              <td>${leave.startDate}</td>
              <td>${leave.endDate}</td>
              <td>${leave.reason}</td>
              <td>
                <span class="status-${
                  leave.status
                }">${leave.status.toUpperCase()}</span>
              </td>
              <td>
                <button class="btn-view" onclick="viewLeaveDetail(${leave.id})">
                  View Detail
                </button>
                <button class="btn-delete" onclick="deleteLeaveRequest(${
                  leave.id
                })">
                  Delete
                </button>
              </td>
            </tr>
          `
        )
        .join("");
    }

    if (showMessageOnLoad) {
      showMessage("Leave requests loaded successfully!", "success");
    }
  } catch (error) {
    showMessage("Error fetching leave requests: " + error.message, "error");
  }
}

// View leave request detail
async function viewLeaveDetail(leaveId) {
  try {
    // Fetch leave request
    const leaveResponse = await fetch(`${API_BASE_URL}/leave`);
    const leaveRequests = await leaveResponse.json();
    const leave = leaveRequests.find((l) => l.id === leaveId);

    if (!leave) {
      showMessage("Leave request not found", "error");
      return;
    }

    // Try to fetch employee information
    let employee = null;
    try {
      const employeeResponse = await fetch(
        `${API_BASE_URL}/employees/${leave.employeeId}`
      );
      if (employeeResponse.ok) {
        employee = await employeeResponse.json();
      }
    } catch (err) {
      // Employee might not exist (already left)
      console.log("Employee not found, may have left the company");
    }

    // Calculate duration
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const duration =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

    const detailContent = document.getElementById("leaveDetailContent");
    detailContent.innerHTML = `
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Leave Request ID:</span>
          <span class="detail-value">${leave.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Employee ID:</span>
          <span class="detail-value">${leave.employeeId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Employee Name:</span>
          <span class="detail-value">${
            employee
              ? `<strong>${employee.name}</strong>`
              : '<span style="color: #dc3545;">(Employee has left the company)</span>'
          }</span>
        </div>
        ${
          employee
            ? `
        <div class="detail-row">
          <span class="detail-label">Department:</span>
          <span class="detail-value">${employee.department}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Leave Balance:</span>
          <span class="detail-value">${employee.leaveBalance}</span>
        </div>
        `
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Start Date:</span>
          <span class="detail-value"><strong>${new Date(
            leave.startDate
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">End Date:</span>
          <span class="detail-value"><strong>${new Date(
            leave.endDate
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value"><strong>${duration} day${
      duration > 1 ? "s" : ""
    }</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reason:</span>
          <span class="detail-value">${leave.reason}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-${
              leave.status
            }">${leave.status.toUpperCase()}</span>
          </span>
        </div>
        <div class="detail-actions">
          ${
            leave.status === "pending"
              ? `<button class="btn-approve" onclick="approveLeave(${leave.id}, true)">Approve</button>`
              : ""
          }
          <button class="btn-delete" onclick="deleteLeaveRequest(${
            leave.id
          }, true)">
            Delete Leave Request
          </button>
        </div>
      </div>
    `;

    showPage("leave-detail");
  } catch (error) {
    showMessage(
      "Error fetching leave request details: " + error.message,
      "error"
    );
  }
}

// Delete leave request
async function deleteLeaveRequest(leaveId, fromDetail = false) {
  if (
    !confirm(
      "Are you sure you want to delete this leave request? Leave balance will be restored if approved."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/${leaveId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Leave request deleted successfully!", "success");

      // Refresh both tables since leaveBalance might have been restored
      loadEmployees(false);
      loadLeaveRequests(false);

      if (fromDetail) {
        showPage("leave-list");
      }
    } else {
      showMessage(data.error || "Error deleting leave request", "error");
    }
  } catch (error) {
    showMessage("Network error: " + error.message, "error");
  }
}

// Handle Create Leave Request Form
document.getElementById("leaveForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const today = new Date().toISOString().split("T")[0];

  // Frontend validation
  if (startDate < today) {
    showMessage("Start date cannot be in the past!", "error");
    return;
  }

  if (endDate < startDate) {
    showMessage("End date cannot be before start date!", "error");
    return;
  }

  const formData = {
    employeeId: parseInt(document.getElementById("employeeId").value),
    startDate: startDate,
    endDate: endDate,
    reason: document.getElementById("reason").value,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Leave request created successfully!", "success");
      // Only reset form on successful submission
      document.getElementById("leaveForm").reset();
      showPage("leave-list");
    } else {
      showMessage(data.error || "Error creating leave request", "error");
      // Form data is preserved for user correction
    }
  } catch (error) {
    showMessage("Network error: " + error.message, "error");
    // Form data is preserved for user correction
  }
});

// Approve Leave Request
async function approveLeave(leaveId, fromDetail = false) {
  if (!confirm("Approve this leave request?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/${leaveId}/approve`, {
      method: "PATCH",
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(
        "Leave request approved! Employee balance deducted.",
        "success"
      );

      // Refresh both employees and leave requests lists
      loadEmployees(false);
      loadLeaveRequests(false);

      if (fromDetail) {
        showPage("leave-list");
      }
    } else {
      showMessage(data.error || "Error approving leave request", "error");
    }
  } catch (error) {
    showMessage("Network error: " + error.message, "error");
  }
}

// ========== SEARCH AND SORT FUNCTIONALITY ==========

// Global variables to store data and sort state
let allEmployees = [];
let allLeaveRequests = [];
let employeeSortColumn = null;
let employeeSortAscending = true;
let leaveSortColumn = null;
let leaveSortAscending = true;

// Modified loadEmployees to store data globally
const originalLoadEmployees = loadEmployees;
async function loadEmployees(showMessageOnLoad = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`);
    allEmployees = await response.json();
    renderEmployeesTable();

    if (showMessageOnLoad) {
      showMessage("Employees loaded successfully!", "success");
    }
  } catch (error) {
    showMessage("Error fetching employees: " + error.message, "error");
  }
}

// Render employees table
function renderEmployeesTable(employees = allEmployees) {
  const tableBody = document.getElementById("employeesTableBody");

  if (employees.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">No employees found</td></tr>';
  } else {
    tableBody.innerHTML = employees
      .map(
        (emp, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${emp.leaveBalance}</td>
            <td>
              <button class="btn-view" onclick="viewEmployeeDetail(${emp.id})">
                View Detail
              </button>
              <button class="btn-delete" onclick="deleteEmployee(${emp.id})">
                Delete
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  }
}

// Filter employees by search
function filterEmployees() {
  const searchTerm = document
    .getElementById("employeeSearch")
    .value.toLowerCase();
  const filtered = allEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm) ||
      emp.department.toLowerCase().includes(searchTerm)
  );
  renderEmployeesTable(filtered);
}

// Sort employees
function sortEmployees(column) {
  if (employeeSortColumn === column) {
    employeeSortAscending = !employeeSortAscending;
  } else {
    employeeSortColumn = column;
    employeeSortAscending = true;
  }

  const sorted = [...allEmployees].sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];

    // Handle string comparison
    if (typeof valueA === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) return employeeSortAscending ? -1 : 1;
    if (valueA > valueB) return employeeSortAscending ? 1 : -1;
    return 0;
  });

  renderEmployeesTable(sorted);
}

// Modified loadLeaveRequests to store data globally
async function loadLeaveRequests(showMessageOnLoad = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/leave`);
    allLeaveRequests = await response.json();
    renderLeaveRequestsTable();

    if (showMessageOnLoad) {
      showMessage("Leave requests loaded successfully!", "success");
    }
  } catch (error) {
    showMessage("Error fetching leave requests: " + error.message, "error");
  }
}

// Render leave requests table
function renderLeaveRequestsTable(leaveRequests = allLeaveRequests) {
  const tableBody = document.getElementById("leaveTableBody");

  if (leaveRequests.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">No leave requests found</td></tr>';
  } else {
    tableBody.innerHTML = leaveRequests
      .map(
        (leave, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${leave.employeeId}</td>
            <td>${leave.startDate}</td>
            <td>${leave.endDate}</td>
            <td>${leave.reason}</td>
            <td>
              <span class="status-${
                leave.status
              }">${leave.status.toUpperCase()}</span>
            </td>
            <td>
              <button class="btn-view" onclick="viewLeaveDetail(${leave.id})">
                View Detail
              </button>
              <button class="btn-delete" onclick="deleteLeaveRequest(${
                leave.id
              })">
                Delete
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  }
}

// Filter leave requests by search
function filterLeaveRequests() {
  const searchTerm = document.getElementById("leaveSearch").value.toLowerCase();
  const filtered = allLeaveRequests.filter(
    (leave) =>
      leave.employeeId.toString().includes(searchTerm) ||
      leave.reason.toLowerCase().includes(searchTerm) ||
      leave.status.toLowerCase().includes(searchTerm)
  );
  renderLeaveRequestsTable(filtered);
}

// Sort leave requests
function sortLeaveRequests(column) {
  if (leaveSortColumn === column) {
    leaveSortAscending = !leaveSortAscending;
  } else {
    leaveSortColumn = column;
    leaveSortAscending = true;
  }

  const sorted = [...allLeaveRequests].sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];

    // Handle date comparison
    if (column === "startDate" || column === "endDate") {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    // Handle string comparison
    else if (typeof valueA === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) return leaveSortAscending ? -1 : 1;
    if (valueA > valueB) return leaveSortAscending ? 1 : -1;
    return 0;
  });

  renderLeaveRequestsTable(sorted);
}
