// NOTE: this client is hand-written for Phase 0. architecture.md/PROJECT-CONVENTIONS
// describe it as "generated from the API's OpenAPI spec" — that generation step
// (openapi-typescript/orval) is a documented follow-up, not done here.

export { configureApiClient, getApiClientConfig } from "./http/config";
export type { ApiClientConfig } from "./http/config";
export { baseFetch } from "./http/base-fetch";
export type { RequestOptions } from "./http/base-fetch";
export { ApiError, parseApiError } from "./http/errors";
export type { ProblemDetails } from "./http/errors";

export { login as staffLogin } from "./auth/login";
export { logout as staffLogout } from "./auth/logout";
export { refresh as staffRefresh } from "./auth/refresh";
export { getMe as getStaffMe, updateMe as updateStaffMe } from "./auth/me";
export type {
  AuthTokens,
  MeView,
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  UpdateMeInput,
} from "./auth/types";

export { register as registerCustomer } from "./customer-auth/register";
export { verify as verifyCustomer } from "./customer-auth/verify";
export { login as customerLogin } from "./customer-auth/login";
export { forgotPassword as forgotCustomerPassword } from "./customer-auth/forgot-password";
export { resetPassword as resetCustomerPassword } from "./customer-auth/reset-password";
export { getMe as getCustomerMe, updateMe as updateCustomerMe } from "./customer-auth/me";
export type {
  CustomerAuthTokens,
  CustomerMeView,
  RegisterCustomerInput,
  VerifyCustomerInput,
  LoginCustomerInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateCustomerMeInput,
} from "./customer-auth/types";

// ── Salon setup (salon, branches, chairs, hours, closures, tax rates) ───────
export { getSalon } from "./salon/get-salon";
export { updateSalon } from "./salon/update-salon";
export type { SalonView, UpdateSalonInput } from "./salon/types";

export { listBranches } from "./branches/list-branches";
export { createBranch } from "./branches/create-branch";
export { updateBranch } from "./branches/update-branch";
export { deleteBranch } from "./branches/delete-branch";
export type { BranchView, CreateBranchInput, UpdateBranchInput } from "./branches/types";

export { listChairs } from "./chairs/list-chairs";
export { createChair } from "./chairs/create-chair";
export { updateChair } from "./chairs/update-chair";
export { retireChair } from "./chairs/retire-chair";
export type { ChairView, CreateChairInput, UpdateChairInput } from "./chairs/types";

export { getBranchHours } from "./branch-hours/get-branch-hours";
export { setBranchHours } from "./branch-hours/set-branch-hours";
export type {
  BranchHoursView,
  BreakWindow,
  SetBranchHoursInput,
  WeekdayHours,
} from "./branch-hours/types";

export { listBranchClosures } from "./branch-closures/list-branch-closures";
export { createBranchClosure } from "./branch-closures/create-branch-closure";
export { deleteBranchClosure } from "./branch-closures/delete-branch-closure";
export type {
  BranchClosureView,
  CreateBranchClosureInput,
} from "./branch-closures/types";

export { listTaxRates } from "./tax-rates/list-tax-rates";
export { createTaxRate } from "./tax-rates/create-tax-rate";
export { updateTaxRate } from "./tax-rates/update-tax-rate";
export type {
  CreateTaxRateInput,
  TaxRateView,
  UpdateTaxRateInput,
} from "./tax-rates/types";

// ── Roles & permissions ──────────────────────────────────────────────────────
export { listPermissions } from "./roles/list-permissions";
export { listRoles } from "./roles/list-roles";
export { createRole } from "./roles/create-role";
export { updateRole } from "./roles/update-role";
export { deleteRole } from "./roles/delete-role";
export { assignRole } from "./roles/assign-role";
export type {
  CreateRoleInput,
  PermissionView,
  RoleGrant,
  RoleView,
  UpdateRoleInput,
} from "./roles/types";

// ── Services ──────────────────────────────────────────────────────────────
export { listServices } from "./services/list-services";
export { getService } from "./services/get-service";
export { createService } from "./services/create-service";
export { updateService } from "./services/update-service";
export { deleteService } from "./services/delete-service";
export { setServiceActive } from "./services/set-service-active";
export type {
  CreateServiceInput,
  ServiceView,
  UpdateServiceInput,
} from "./services/types";

export { listServiceCategories } from "./service-categories/list-service-categories";
export { createServiceCategory } from "./service-categories/create-service-category";
export { updateServiceCategory } from "./service-categories/update-service-category";
export type {
  CreateServiceCategoryInput,
  ServiceCategoryView,
  UpdateServiceCategoryInput,
} from "./service-categories/types";

export { listServiceAddOns } from "./service-add-ons/list-service-add-ons";
export { createServiceAddOn } from "./service-add-ons/create-service-add-on";
export { updateServiceAddOn } from "./service-add-ons/update-service-add-on";
export type {
  CreateServiceAddOnInput,
  ServiceAddOnView,
  UpdateServiceAddOnInput,
} from "./service-add-ons/types";

// ── Stylists ──────────────────────────────────────────────────────────────
export { listStylists } from "./stylists/list-stylists";
export { getStylist } from "./stylists/get-stylist";
export { createStylist } from "./stylists/create-stylist";
export { updateStylist } from "./stylists/update-stylist";
export { setStylistStatus } from "./stylists/set-stylist-status";
export { getStylistServices } from "./stylists/get-stylist-services";
export { putStylistServices } from "./stylists/put-stylist-services";
export type {
  CreateStylistInput,
  PutStylistServicesInput,
  SetStylistStatusInput,
  StylistServiceView,
  StylistStatus,
  StylistView,
  UpdateStylistInput,
} from "./stylists/types";

// ── Staff ─────────────────────────────────────────────────────────────────
export { createStaffInvite } from "./staff/create-staff-invite";
export { listStaffInvites } from "./staff/list-staff-invites";
export { revokeStaffInvite } from "./staff/revoke-staff-invite";
export { resolveStaffInvite } from "./staff/resolve-staff-invite";
export { acceptStaffInvite } from "./staff/accept-staff-invite";
export { listStaff } from "./staff/list-staff";
export { updateStaff } from "./staff/update-staff";
export type {
  AcceptStaffInviteInput,
  CreateStaffInviteInput,
  StaffInviteResolveView,
  StaffInviteStatus,
  StaffInviteView,
  StaffMemberView,
  UpdateStaffInput,
} from "./staff/types";

// ── Queue ─────────────────────────────────────────────────────────────────
export { listQueue } from "./queue/list-queue";
export { joinQueue } from "./queue/join-queue";
export { assignQueue } from "./queue/assign-queue";
export { startQueue } from "./queue/start-queue";
export { completeQueue } from "./queue/complete-queue";
export { removeQueue } from "./queue/remove-queue";
export { getQueueWaitEstimate } from "./queue/get-queue-wait-estimate";
export type {
  AssignQueueInput,
  JoinQueueInput,
  QueueEntryStatus,
  QueueEntryView,
  RemoveQueueInput,
  WaitEstimateView,
} from "./queue/types";

// ── Appointments ──────────────────────────────────────────────────────────
export { listAppointments } from "./appointments/list-appointments";
export { createAppointment } from "./appointments/create-appointment";
export { getAppointment } from "./appointments/get-appointment";
export { updateAppointment } from "./appointments/update-appointment";
export { arriveAppointment } from "./appointments/arrive-appointment";
export { startAppointment } from "./appointments/start-appointment";
export { completeAppointment } from "./appointments/complete-appointment";
export { noShowAppointment } from "./appointments/no-show-appointment";
export { cancelAppointment } from "./appointments/cancel-appointment";
export type {
  AppointmentStatus,
  AppointmentView,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./appointments/types";

// ── Tickets (POS) ─────────────────────────────────────────────────────────
export { openRegisterSession } from "./tickets/open-register-session";
export { closeRegisterSession } from "./tickets/close-register-session";
export { getCurrentRegisterSession } from "./tickets/get-current-register-session";
export { createTicket } from "./tickets/create-ticket";
export { listTickets } from "./tickets/list-tickets";
export { getTicket } from "./tickets/get-ticket";
export { addTicketLine } from "./tickets/add-ticket-line";
export { updateTicketLine } from "./tickets/update-ticket-line";
export { deleteTicketLine } from "./tickets/delete-ticket-line";
export { applyTicketDiscount } from "./tickets/apply-ticket-discount";
export { voidTicket } from "./tickets/void-ticket";
export type {
  AddTicketLineInput,
  ApplyDiscountInput,
  CloseRegisterSessionInput,
  CreateTicketInput,
  OpenRegisterSessionInput,
  RegisterSessionView,
  TicketLineKind,
  TicketLineView,
  TicketSource,
  TicketStatus,
  TicketView,
  UpdateTicketLineInput,
  VoidTicketInput,
} from "./tickets/types";

// ── Payments ──────────────────────────────────────────────────────────────
export { createPayment } from "./payments/create-payment";
export { refundPayment } from "./payments/refund-payment";
export { listPayments } from "./payments/list-payments";
export { getPayment } from "./payments/get-payment";
export { getTicketReceipt } from "./payments/get-ticket-receipt";
export type {
  CreatePaymentInput,
  PaymentMethod,
  PaymentStatus,
  PaymentView,
  ReceiptLineView,
  ReceiptView,
  RefundInput,
} from "./payments/types";

// ── Customers ─────────────────────────────────────────────────────────────
export { listCustomers } from "./customers/list-customers";
export { createCustomer } from "./customers/create-customer";
export { getCustomer } from "./customers/get-customer";
export { updateCustomer } from "./customers/update-customer";
export { getCustomerVisits } from "./customers/get-customer-visits";
export type {
  CreateCustomerInput,
  CustomerVisitView,
  CustomerView,
  UpdateCustomerInput,
} from "./customers/types";

// ── Reports ───────────────────────────────────────────────────────────────
export { getDayReport } from "./reports/get-day-report";
export { getSalesByService } from "./reports/get-sales-by-service";
export { getSalesByStylist } from "./reports/get-sales-by-stylist";
export { getRegisterSessionReport } from "./reports/get-register-session-report";
export type {
  DayReportView,
  RegisterSessionReportView,
  SalesByServiceRow,
  SalesByStylistRow,
} from "./reports/types";
