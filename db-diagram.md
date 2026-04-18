// =========================================================
// HEALTH BACKEND — DATABASE SCHEMA (from prisma/schema.prisma)
// PostgreSQL via Prisma. Table/column names follow Prisma defaults.
// =========================================================

// 0. COMPANY CONFIGURATION
Table CompanySettings {
  id uuid [pk]
  companyName text [not null]
  companyEmail text
  companyPhone text
  companyAddress text
  logoUrl text
  primaryColor text
  secondaryColor text
  currencyCode text
  travelCostPerKm decimal [default: 0]
  taxPercentage decimal [default: 0]
  invoicePrefix text [default: "INV-"]
  isSetupCompleted boolean [default: false]
  updatedAt timestamptz [default: `now()`]
}

// 0. DYNAMIC LOOKUPS
Table LookupCategory {
  id uuid [pk]
  categoryName text [unique, not null]
}

Table Lookup {
  id uuid [pk]
  categoryId uuid [ref: > LookupCategory.id, not null]
  lookupKey text [not null]
  lookupValue text [not null]
  isActive boolean [default: true]
  Indexes {
    (categoryId, lookupKey) [unique]
  }
}

// 1. ACCESS CONTROL
Table Role {
  id uuid [pk]
  roleName text [unique, not null]
  description text
}

Table Permission {
  id uuid [pk]
  permissionKey text [unique, not null]
}

Table RolePermission {
  roleId uuid [ref: > Role.id, not null]
  permissionId uuid [ref: > Permission.id, not null]
  Indexes {
    (roleId, permissionId) [pk]
  }
}

// 2. USERS (manual auth)
Table User {
  id uuid [pk]
  fullName text [not null]
  email text [unique, not null]
  password text [not null]
  phoneNumber text
  baseConsultationFee decimal [default: 0]
  roleId uuid [ref: > Role.id, not null]
  isActive boolean [default: true]
  createdAt timestamptz [default: `now()`]
}

Table PasswordResetToken {
  id uuid [pk]
  userId uuid [ref: > User.id, not null]
  tokenHash text [unique, not null]
  expiresAt timestamptz [not null]
  createdAt timestamptz [default: `now()`]
  Indexes {
    userId
  }
}

// 3. FLEET & MEDICAL TEAMS
Table Vehicle {
  id uuid [pk]
  vehicleNo text [unique, not null]
  model text
  status text [default: "Available"]
  statusId uuid [ref: > Lookup.id]
  currentDriverId uuid [ref: > User.id]
}

Table MedicalTeam {
  id uuid [pk]
  teamName text
  vehicleId uuid [ref: > Vehicle.id, not null]
}

Table TeamMember {
  id uuid [pk]
  teamId uuid [ref: > MedicalTeam.id, not null]
  userId uuid [ref: > User.id, not null]
  isLead boolean [default: false]
  Indexes {
    (teamId, userId) [unique]
  }
}

// 4. PATIENTS
Table Patient {
  id uuid [pk]
  nicOrPassport text [unique]
  fullName text [not null]
  shortName text
  dob timestamptz
  contactNo text
  whatsappNo text
  email text
  gender text
  genderId uuid [ref: > Lookup.id]
  address text
  hasInsurance boolean [default: false]
  hasGuardian boolean [default: false]
  guardianName text
  guardianEmail text
  guardianWhatsappNo text
  guardianContactNo text
  guardianRelationship text
  billingRecipientId uuid [ref: > Lookup.id]
  outstandingBalance decimal [default: 0]
}

// 5. BOOKINGS & DISPATCH
Table Booking {
  id uuid [pk]
  patientId uuid [ref: > Patient.id, not null]
  scheduledDate timestamptz
  status text [default: "Pending"]
  statusId uuid [ref: > Lookup.id]
  bookingRemark text
  requestedDoctorId uuid [ref: > User.id]
  doctorStatusId uuid [ref: > Lookup.id]
  isOpd boolean [default: false]
  Indexes {
    requestedDoctorId
    doctorStatusId
    isOpd
  }
}

Table DispatchRecord {
  id uuid [pk]
  bookingId uuid [ref: > Booking.id, not null]
  vehicleId uuid [ref: > Vehicle.id, not null]
  dispatchedAt timestamptz [default: `now()`]
  statusId uuid [ref: > Lookup.id]
}

Table DispatchAssignment {
  id uuid [pk]
  dispatchId uuid [ref: > DispatchRecord.id, not null]
  userId uuid [ref: > User.id, not null]
  isTeamLeader boolean [default: false]
  assignedAt timestamptz [default: `now()`]
  Indexes {
    dispatchId
    userId
  }
}

// 6. VISITS (one VisitRecord per Booking)
Table VisitRecord {
  id uuid [pk]
  bookingId uuid [ref: - Booking.id, unique, not null]
  patientId uuid [ref: > Patient.id, not null]
  remark text
  completedAt timestamptz
}

// 7. SUBSCRIPTION
Table SubscriptionPlan {
  id uuid [pk]
  planName text [not null]
  planTypeId uuid [ref: > Lookup.id, not null]
  price decimal [not null]
  maxMembers int [default: 1]
  durationDays int [not null]
  isActive boolean [default: true]
}

Table SubscriptionAccount {
  id uuid [pk]
  accountName text
  registrationNo text
  billingAddress text
  contactEmail text
  contactPhone text
  whatsappNo text
  primaryContactId uuid [ref: > Patient.id]
  planId uuid [ref: > SubscriptionPlan.id, not null]
  startDate timestamptz
  endDate timestamptz
  statusId uuid [ref: > Lookup.id]
  outstandingBalance decimal [default: 0]
  creditLimit decimal [default: 0]
  Indexes {
    primaryContactId
  }
}

Table SubscriptionMember {
  id uuid [pk]
  subscriptionAccountId uuid [ref: > SubscriptionAccount.id, not null]
  patientId uuid [ref: > Patient.id, not null]
  joinedAt timestamptz [default: `now()`]
  Indexes {
    (subscriptionAccountId, patientId) [unique]
  }
}

// 8. DIAGNOSTICS & LABS
Table DiagnosticReport {
  id uuid [pk]
  patientId uuid [ref: > Patient.id, not null]
  visitId uuid [ref: > VisitRecord.id]
  reportName text [not null]
  reportTypeId uuid [ref: > Lookup.id]
  fileUrl text [not null]
  uploadedById uuid [ref: > User.id, not null]
  uploadedAt timestamptz [default: `now()`]
}

Table LabSample {
  id uuid [pk]
  patientId uuid [ref: > Patient.id, not null]
  visitId uuid [ref: > VisitRecord.id]
  sampleType text [not null]
  collectedAt timestamptz [default: `now()`]
  collectedById uuid [ref: > User.id, not null]
  statusId uuid [ref: > Lookup.id]
  labName text
  resultReportUrl text
  resultReceivedAt timestamptz
}

// 9. INVENTORY & TRANSFERS
Table Medicine {
  id uuid [pk]
  name text [not null]
  genericName text
  sellingPrice decimal [not null]
  uom text
  uomId uuid [ref: > Lookup.id]
  minStockLevel int
}

Table InventoryBatch {
  id uuid [pk]
  medicineId uuid [ref: > Medicine.id, not null]
  batchNo text [not null]
  expiryDate timestamptz [not null]
  quantity int [not null]
  buyingPrice decimal [not null]
  locationType text [not null]
  locationTypeId uuid [ref: > Lookup.id]
  locationId uuid
}

Table StockTransfer {
  id uuid [pk]
  medicineId uuid [ref: > Medicine.id, not null]
  batchId uuid [ref: > InventoryBatch.id, not null]
  fromLocationId uuid [not null]
  toLocationId uuid [not null]
  quantity int [not null]
  status text [default: "Pending"]
  statusId uuid [ref: > Lookup.id]
  transferredById uuid [ref: > User.id, not null]
  createdAt timestamptz [default: `now()`]
}

Table DispensedMedicine {
  id uuid [pk]
  visitId uuid [ref: > VisitRecord.id, not null]
  medicineId uuid [ref: > Medicine.id, not null]
  batchId uuid [ref: > InventoryBatch.id, not null]
  quantity int [not null]
  dispensedById uuid [ref: > User.id, not null]
  unitPriceAtTime decimal [not null]
}

// 10. INVOICING & PAYMENTS
Table Invoice {
  id uuid [pk]
  invoiceTypeId uuid [ref: > Lookup.id, not null]
  bookingId uuid [ref: > Booking.id]
  patientId uuid [ref: > Patient.id]
  subscriptionAccountId uuid [ref: > SubscriptionAccount.id]
  totalAmount decimal [not null]
  consultationTotal decimal [not null]
  medicineTotal decimal [not null]
  travelCost decimal [not null]
  paidAmount decimal [default: 0]
  balanceDue decimal [not null]
  paymentStatus text [default: "Unpaid"]
  paymentStatusId uuid [ref: > Lookup.id]
  createdAt timestamptz [default: `now()`]
  Indexes {
    invoiceTypeId
    subscriptionAccountId
  }
}

Table MembershipInvoice {
  invoiceId uuid [pk, ref: - Invoice.id]
  subscriptionAccountId uuid [ref: > SubscriptionAccount.id, not null]
  patientId uuid [ref: > Patient.id]
  createdAt timestamptz [default: `now()`]
  Indexes {
    subscriptionAccountId
    patientId
  }
}

Table VisitInvoice {
  invoiceId uuid [pk, ref: - Invoice.id]
  bookingId uuid [ref: - Booking.id, unique, not null]
  patientId uuid [ref: > Patient.id]
  createdAt timestamptz [default: `now()`]
  Indexes {
    patientId
  }
}

Table Payment {
  id uuid [pk]
  invoiceId uuid [ref: > Invoice.id, not null]
  amountPaid decimal [not null]
  paymentMethodId uuid [ref: > Lookup.id, not null]
  paymentPurposeId uuid [ref: > Lookup.id]
  transactionRef text
  paySlipUrl text
  paidAt timestamptz [default: `now()`]
  collectedById uuid [ref: > User.id, not null]
  Indexes {
    invoiceId
    paymentPurposeId
  }
}

Table PaymentCollectorSettlement {
  id uuid [pk]
  collectorId uuid [ref: > User.id, not null]
  settledDate timestamptz [not null]
  paymentMethodKey text [not null]
  totalAmountAtSettle decimal [not null]
  settledAt timestamptz [default: `now()`]
  settledById uuid [ref: > User.id]
  Indexes {
    (collectorId, settledDate, paymentMethodKey) [unique]
    settledDate
    paymentMethodKey
  }
}

Table AccountTransaction {
  id uuid [pk]
  patientId uuid [ref: > Patient.id]
  subscriptionAccountId uuid [ref: > SubscriptionAccount.id]
  transactionTypeId uuid [ref: > Lookup.id, not null]
  amount decimal [not null]
  description text
  createdAt timestamptz [default: `now()`]
  Indexes {
    subscriptionAccountId
    patientId
  }
}

// 11. OPD QUEUE
Table OpdQueue {
  id uuid [pk]
  patientId uuid [ref: > Patient.id, not null]
  tokenNo serial
  status text [default: "Waiting"]
  statusId uuid [ref: > Lookup.id]
  visitDate timestamptz [default: `now()`]
  bookingId uuid [ref: - Booking.id, unique]
  pickedByUserId uuid [ref: > User.id]
  pickedAt timestamptz
  Indexes {
    pickedByUserId
  }
}

Table OpdInvoice {
  invoiceId uuid [pk, ref: - Invoice.id]
  opdQueueId uuid [ref: - OpdQueue.id, unique, not null]
  bookingId uuid [ref: - Booking.id, unique, not null]
  patientId uuid [ref: > Patient.id]
  createdAt timestamptz [default: `now()`]
  Indexes {
    patientId
  }
}

Table OpdEligibleDoctor {
  userId uuid [pk, ref: - User.id]
  isActive boolean [default: true]
  createdAt timestamptz [default: `now()`]
}

// --- Lookup usage (Lookup rows referenced by FKs above) ---
// Vehicle.statusId, Patient.genderId, Booking.statusId / doctorStatusId,
// DispatchRecord.statusId, Medicine.uomId, InventoryBatch.locationTypeId,
// StockTransfer.statusId, Invoice.invoiceTypeId / paymentStatusId,
// OpdQueue.statusId, SubscriptionPlan.planTypeId, SubscriptionAccount.statusId,
// DiagnosticReport.reportTypeId, LabSample.statusId,
// Payment.paymentMethodId / paymentPurposeId, AccountTransaction.transactionTypeId
