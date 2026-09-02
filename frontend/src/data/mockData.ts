import type { ChartDataPoint, KPI } from '../types'

// ─── Overview / Landing Page ───────────────────────────────────────────────

export const overviewKPIs: KPI[] = [
  { label: 'Total Beneficiaries', value: '12,45,320', change: 8.2, changeLabel: 'vs last month', color: 'blue', link: '/dashboard/mp/beneficiaries' },
  { label: 'Total Claims', value: '48,756', change: 5.4, changeLabel: 'vs last month', color: 'green', link: '/dashboard/mp/claims-payments' },
  { label: 'Claims Paid Amount', value: '₹125.4 Cr', change: 12.1, changeLabel: 'vs last month', color: 'emerald', link: '/dashboard/mp/claims-payments' },
  { label: 'Cards Printed', value: '9,82,450', change: 3.7, changeLabel: 'vs last month', color: 'purple', link: '/dashboard/bis/card-printing' },
  { label: 'Hospitals Empanelled', value: '2,185', change: 1.2, changeLabel: 'vs last month', color: 'orange', link: '/dashboard/mp/hospitals' },
  { label: 'Suspicious Cases', value: '342', change: -12.5, changeLabel: 'vs last month', color: 'red', link: '/dashboard/mp/fraud-audit' },
  { label: 'Avg Processing Time', value: '2.4 hrs', change: -15.2, changeLabel: 'vs last month', color: 'cyan', link: '/dashboard/mp/users-workflow' },
  { label: 'LMS Completion Rate', value: '73.4%', change: 2.1, changeLabel: 'vs last month', color: 'blue', link: '/dashboard/mp/lms-training' },
]

export const claimsTrendData: ChartDataPoint[] = [
  { name: 'Jan', claims: 3200, amount: 8.2, preauth: 2900 },
  { name: 'Feb', claims: 3800, amount: 9.5, preauth: 3400 },
  { name: 'Mar', claims: 4100, amount: 10.1, preauth: 3700 },
  { name: 'Apr', claims: 3900, amount: 9.8, preauth: 3500 },
  { name: 'May', claims: 4500, amount: 11.4, preauth: 4100 },
  { name: 'Jun', claims: 4800, amount: 12.2, preauth: 4350 },
  { name: 'Jul', claims: 5200, amount: 13.5, preauth: 4800 },
  { name: 'Aug', claims: 4876, amount: 12.8, preauth: 4400 },
]

export const stateComparisonData: ChartDataPoint[] = [
  { name: 'Bhopal', claims: 14200, beneficiaries: 180000, hospitals: 215 },
  { name: 'Indore', claims: 12500, beneficiaries: 165000, hospitals: 248 },
  { name: 'Jabalpur', claims: 9800, beneficiaries: 130000, hospitals: 182 },
  { name: 'Gwalior', claims: 7500, beneficiaries: 98000, hospitals: 154 },
  { name: 'Ujjain', claims: 4756, beneficiaries: 75320, hospitals: 98 },
]

export const cardPrintingFunnel: ChartDataPoint[] = [
  { name: 'Enrolled', value: 1245320 },
  { name: 'Approved', value: 1102450 },
  { name: 'Card Generated', value: 1050000 },
  { name: 'Printed', value: 982450 },
  { name: 'Distributed', value: 920000 },
  { name: 'Delivered', value: 875000 },
]

export const claimStatusDistribution: ChartDataPoint[] = [
  { name: 'Paid', value: 28500 },
  { name: 'Approved', value: 8200 },
  { name: 'Pending', value: 6500 },
  { name: 'Rejected', value: 3556 },
  { name: 'Under Review', value: 2000 },
]

export const claimsWorkflowFunnel: ChartDataPoint[] = [
  { name: 'Preauth Initiated', value: 52000 },
  { name: 'Preauth Approved', value: 47800 },
  { name: 'Surgery Done', value: 44200 },
  { name: 'Claim Initiated', value: 42000 },
  { name: 'Claim Approved', value: 38500 },
  { name: 'Payment Paid', value: 35200 },
]

// ─── BIS Card Printing ─────────────────────────────────────────────────────

export const bisKPIs: KPI[] = [
  { label: 'Total Cards', value: '9,82,450', change: 3.7, color: 'blue' },
  { label: 'Delivered', value: '8,75,000', change: 5.8, color: 'green' },
  { label: 'Printed', value: '9,47,200', change: 4.1, color: 'emerald' },
  { label: 'Distributed', value: '9,20,000', change: 4.9, color: 'cyan' },
  { label: 'Generated', value: '9,62,000', change: 3.2, color: 'purple' },
  { label: 'Pending Print', value: '1,37,250', change: -1.2, color: 'orange' },
  { label: 'Approved', value: '10,02,450', change: 2.8, color: 'blue' },
  { label: 'Disabled Cards', value: '42,500', change: 1.1, color: 'red' },
]

export const bisStatusData: ChartDataPoint[] = [
  { name: 'Delivered', value: 875000 },
  { name: 'Distributed', value: 45000 },
  { name: 'Printed', value: 27200 },
  { name: 'Generated', value: 14800 },
  { name: 'Approved', value: 12950 },
  { name: 'Pending', value: 7500 },
]

export const bisDistrictData: ChartDataPoint[] = [
  { name: 'Bhopal', printed: 125000, pending: 8500, delivered: 118000 },
  { name: 'Indore', printed: 142000, pending: 12000, delivered: 135000 },
  { name: 'Jabalpur', printed: 98000, pending: 6200, delivered: 93500 },
  { name: 'Gwalior', printed: 87000, pending: 5800, delivered: 82000 },
  { name: 'Ujjain', printed: 76000, pending: 4500, delivered: 71000 },
  { name: 'Sagar', printed: 65000, pending: 3800, delivered: 60500 },
  { name: 'Rewa', printed: 72000, pending: 4200, delivered: 67000 },
]

export const bisUrbanRuralData: ChartDataPoint[] = [
  { name: 'Rural - Delivered', value: 612000 },
  { name: 'Rural - Printed', value: 38000 },
  { name: 'Rural - Pending', value: 96000 },
  { name: 'Urban - Delivered', value: 263000 },
  { name: 'Urban - Printed', value: 19000 },
  { name: 'Urban - Pending', value: 41250 },
]

export const bisUrbanRuralBar: ChartDataPoint[] = [
  { name: 'Rural', delivered: 612000, printed: 38000, pending: 96000 },
  { name: 'Urban', delivered: 263000, printed: 19000, pending: 41250 },
]

export const bisSourceTypeData: ChartDataPoint[] = [
  { name: 'SECC', value: 680000 },
  { name: 'State List', value: 180000 },
  { name: 'Contractor', value: 80000 },
  { name: 'Walk-in', value: 42450 },
]

export const bisMonthlyTrendData: ChartDataPoint[] = [
  { name: 'Jan', printed: 38000, delivered: 35000 },
  { name: 'Feb', printed: 42000, delivered: 39500 },
  { name: 'Mar', printed: 51000, delivered: 48000 },
  { name: 'Apr', printed: 46000, delivered: 43200 },
  { name: 'May', printed: 58000, delivered: 55100 },
  { name: 'Jun', printed: 62000, delivered: 58400 },
  { name: 'Jul', printed: 55000, delivered: 52200 },
  { name: 'Aug', printed: 48000, delivered: 45600 },
]

export const bisTableData = [
  { card_no: 'ABHA-MP-001234', ben_id: 'BEN-452100', family_id: 'FAM-90012', state_cd: 'MP', district: 'Bhopal', block: 'Huzur', enroll_date: '2025-03-10', approve_date: '2025-03-12', card_gen_date: '2025-03-15', card_print_date: '2025-03-20', distribute_date: '2025-04-01', deliver_date: '2025-04-05', status: 'Delivered', source_type: 'SECC' },
  { card_no: 'ABHA-MP-001235', ben_id: 'BEN-452101', family_id: 'FAM-90013', state_cd: 'MP', district: 'Indore', block: 'Indore-1', enroll_date: '2025-04-18', approve_date: '2025-04-20', card_gen_date: '2025-04-23', card_print_date: '2025-04-28', distribute_date: '2025-05-05', deliver_date: '-', status: 'Distributed', source_type: 'SECC' },
  { card_no: 'ABHA-MP-001236', ben_id: 'BEN-452102', family_id: 'FAM-90014', state_cd: 'MP', district: 'Jabalpur', block: 'Bargi', enroll_date: '2025-06-01', approve_date: '2025-06-03', card_gen_date: '2025-06-06', card_print_date: '2025-06-12', distribute_date: '-', deliver_date: '-', status: 'Printed', source_type: 'State List' },
  { card_no: 'ABHA-MP-001237', ben_id: 'BEN-452103', family_id: 'FAM-90015', state_cd: 'MP', district: 'Gwalior', block: 'Gwalior', enroll_date: '2025-02-20', approve_date: '2025-02-22', card_gen_date: '2025-02-25', card_print_date: '2025-03-05', distribute_date: '2025-03-12', deliver_date: '2025-03-18', status: 'Delivered', source_type: 'SECC' },
  { card_no: 'ABHA-MP-001238', ben_id: 'BEN-452104', family_id: 'FAM-90016', state_cd: 'MP', district: 'Ujjain', block: 'Mahidpur', enroll_date: '2025-07-10', approve_date: '2025-07-12', card_gen_date: '-', card_print_date: '-', distribute_date: '-', deliver_date: '-', status: 'Approved', source_type: 'Contractor' },
  { card_no: 'ABHA-MP-001239', ben_id: 'BEN-452105', family_id: 'FAM-90017', state_cd: 'MP', district: 'Sagar', block: 'Sagar', enroll_date: '2025-05-25', approve_date: '2025-05-27', card_gen_date: '2025-05-30', card_print_date: '2025-06-05', distribute_date: '2025-06-15', deliver_date: '2025-06-20', status: 'Delivered', source_type: 'SECC' },
  { card_no: 'ABHA-MP-001240', ben_id: 'BEN-452106', family_id: 'FAM-90018', state_cd: 'MP', district: 'Rewa', block: 'Rewa', enroll_date: '2025-07-15', approve_date: '-', card_gen_date: '-', card_print_date: '-', distribute_date: '-', deliver_date: '-', status: 'Pending', source_type: 'Walk-in' },
  { card_no: 'ABHA-MP-001241', ben_id: 'BEN-452107', family_id: 'FAM-90019', state_cd: 'MP', district: 'Satna', block: 'Satna', enroll_date: '2025-01-05', approve_date: '2025-01-07', card_gen_date: '2025-01-10', card_print_date: '2025-01-15', distribute_date: '2025-01-25', deliver_date: '2025-02-01', status: 'Delivered', source_type: 'SECC' },
  { card_no: 'ABHA-MP-001242', ben_id: 'BEN-452108', family_id: 'FAM-90020', state_cd: 'MP', district: 'Chhindwara', block: 'Chhindwara', enroll_date: '2025-06-28', approve_date: '2025-06-30', card_gen_date: '2025-07-03', card_print_date: '-', distribute_date: '-', deliver_date: '-', status: 'Generated', source_type: 'State List' },
  { card_no: 'ABHA-MP-001243', ben_id: 'BEN-452109', family_id: 'FAM-90021', state_cd: 'MP', district: 'Datia', block: 'Datia', enroll_date: '2025-04-08', approve_date: '2025-04-10', card_gen_date: '2025-04-13', card_print_date: '2025-04-18', distribute_date: '2025-04-28', deliver_date: '2025-05-02', status: 'Delivered', source_type: 'SECC' },
]

// ─── MP Beneficiaries ──────────────────────────────────────────────────────

export const mpBeneficiaryKPIs: KPI[] = [
  { label: 'Total Beneficiaries', value: '12,45,320', change: 7.5, color: 'blue' },
  { label: 'eKYC Completed', value: '10,82,400', change: 9.2, color: 'green' },
  { label: 'ABHA Linked', value: '9,45,210', change: 14.6, color: 'emerald' },
  { label: 'Active Beneficiaries', value: '11,20,800', change: 5.1, color: 'cyan' },
  { label: 'Disabled Beneficiaries', value: '42,500', change: 2.1, color: 'orange' },
  { label: 'New Enrollments (MTD)', value: '18,450', change: 12.4, color: 'purple' },
  { label: 'Pending Approval', value: '52,800', change: -8.3, color: 'orange' },
  { label: 'Rural Beneficiaries', value: '9,34,000', change: 6.2, color: 'blue' },
]

export const mpBeneficiaryGender: ChartDataPoint[] = [
  { name: 'Male', value: 632000 },
  { name: 'Female', value: 598000 },
  { name: 'Other', value: 15320 },
]

export const mpBeneficiaryUrbanRural: ChartDataPoint[] = [
  { name: 'Rural', value: 934000 },
  { name: 'Urban', value: 311320 },
]

export const mpBeneficiaryDistrictData: ChartDataPoint[] = [
  { name: 'Bhopal', enrolled: 128000, active: 118500 },
  { name: 'Indore', enrolled: 145000, active: 133200 },
  { name: 'Jabalpur', enrolled: 98000, active: 90100 },
  { name: 'Gwalior', enrolled: 85000, active: 78400 },
  { name: 'Ujjain', enrolled: 72000, active: 66800 },
  { name: 'Sagar', enrolled: 65000, active: 59200 },
  { name: 'Rewa', enrolled: 78000, active: 71500 },
  { name: 'Satna', enrolled: 58000, active: 53400 },
]

export const mpBeneficiaryEnrollStatus: ChartDataPoint[] = [
  { name: 'Active', value: 1120800 },
  { name: 'Pending Approval', value: 52800 },
  { name: 'Disabled', value: 42500 },
  { name: 'Rejected', value: 29220 },
]

export const mpBeneficiaryCardStatus: ChartDataPoint[] = [
  { name: 'Delivered', value: 875000 },
  { name: 'Printed', value: 107450 },
  { name: 'Generated', value: 79550 },
  { name: 'Approved', value: 90200 },
  { name: 'Pending', value: 93120 },
]

export const mpBeneficiaryMonthlyEnroll: ChartDataPoint[] = [
  { name: 'Jan', enrollments: 12800, approvals: 11500 },
  { name: 'Feb', enrollments: 14200, approvals: 13100 },
  { name: 'Mar', enrollments: 16500, approvals: 15200 },
  { name: 'Apr', enrollments: 15200, approvals: 14000 },
  { name: 'May', enrollments: 18900, approvals: 17500 },
  { name: 'Jun', enrollments: 20100, approvals: 18800 },
  { name: 'Jul', enrollments: 19500, approvals: 18200 },
  { name: 'Aug', enrollments: 18450, approvals: 17100 },
]

export const mpBeneficiaryEkycAbha: ChartDataPoint[] = [
  { name: 'Bhopal', ekyc: 121000, abha: 102000 },
  { name: 'Indore', ekyc: 138000, abha: 118500 },
  { name: 'Jabalpur', ekyc: 91000, abha: 76000 },
  { name: 'Gwalior', ekyc: 79000, abha: 65000 },
  { name: 'Ujjain', ekyc: 67000, abha: 54000 },
  { name: 'Sagar', ekyc: 58000, abha: 46000 },
]

export const mpBeneficiaryTableData = [
  { ben_id: 'BEN-MP-452100', name: 'Ramesh Patel', family_id: 'FAM-90012', member_id: '01', gender: 'Male', dob: '1979-05-14', district: 'Indore', block: 'Indore-2', village: 'Simrol', rural_urban: 'Rural', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452100', ekyc: 'Completed', enrol_date: '2025-01-10', approve_date: '2025-01-12' },
  { ben_id: 'BEN-MP-452101', name: 'Savitri Devi', family_id: 'FAM-90013', member_id: '02', gender: 'Female', dob: '1986-08-22', district: 'Bhopal', block: 'Huzur', village: 'Kolar', rural_urban: 'Urban', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452101', ekyc: 'Completed', enrol_date: '2025-01-15', approve_date: '2025-01-17' },
  { ben_id: 'BEN-MP-452102', name: 'Arjun Meena', family_id: 'FAM-90014', member_id: '01', gender: 'Male', dob: '1972-11-30', district: 'Jabalpur', block: 'Bargi', village: 'Ghansaur', rural_urban: 'Rural', enrl_status: 'Active', card_status: 'Printed', aadhar_status: 'Verified', abha_id: '-', ekyc: 'Pending', enrol_date: '2025-03-05', approve_date: '2025-03-07' },
  { ben_id: 'BEN-MP-452103', name: 'Lakshmi Bai', family_id: 'FAM-90015', member_id: '03', gender: 'Female', dob: '1963-02-18', district: 'Gwalior', block: 'Gwalior', village: 'Murar', rural_urban: 'Urban', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452103', ekyc: 'Completed', enrol_date: '2024-11-20', approve_date: '2024-11-22' },
  { ben_id: 'BEN-MP-452104', name: 'Vijay Kumar', family_id: 'FAM-90016', member_id: '01', gender: 'Male', dob: '1995-07-04', district: 'Ujjain', block: 'Mahidpur', village: 'Tarana', rural_urban: 'Rural', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452104', ekyc: 'Completed', enrol_date: '2025-02-12', approve_date: '2025-02-14' },
  { ben_id: 'BEN-MP-452105', name: 'Sunita Yadav', family_id: 'FAM-90017', member_id: '02', gender: 'Female', dob: '1988-04-25', district: 'Sagar', block: 'Sagar', village: 'Banda', rural_urban: 'Rural', enrl_status: 'Pending Approval', card_status: 'Approved', aadhar_status: 'Verified', abha_id: '-', ekyc: 'Pending', enrol_date: '2025-07-01', approve_date: '-' },
  { ben_id: 'BEN-MP-452106', name: 'Mohan Singh', family_id: 'FAM-90018', member_id: '01', gender: 'Male', dob: '1958-12-10', district: 'Rewa', block: 'Rewa', village: 'Naigarhi', rural_urban: 'Rural', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452106', ekyc: 'Completed', enrol_date: '2024-09-15', approve_date: '2024-09-17' },
  { ben_id: 'BEN-MP-452107', name: 'Kamla Devi', family_id: 'FAM-90019', member_id: '04', gender: 'Female', dob: '1945-06-08', district: 'Satna', block: 'Satna', village: 'Chitrakoot', rural_urban: 'Rural', enrl_status: 'Active', card_status: 'Distributed', aadhar_status: 'Verified', abha_id: 'ABHA-452107', ekyc: 'Completed', enrol_date: '2025-04-02', approve_date: '2025-04-04' },
  { ben_id: 'BEN-MP-452108', name: 'Ramlal Thakur', family_id: 'FAM-90020', member_id: '01', gender: 'Male', dob: '1970-09-19', district: 'Chhindwara', block: 'Chhindwara', village: 'Parasia', rural_urban: 'Rural', enrl_status: 'Disabled', card_status: 'Pending', aadhar_status: 'Not Verified', abha_id: '-', ekyc: 'Pending', enrol_date: '2025-05-20', approve_date: '-' },
  { ben_id: 'BEN-MP-452109', name: 'Parvati Sharma', family_id: 'FAM-90021', member_id: '02', gender: 'Female', dob: '1982-01-30', district: 'Datia', block: 'Datia', village: 'Datia City', rural_urban: 'Urban', enrl_status: 'Active', card_status: 'Delivered', aadhar_status: 'Verified', abha_id: 'ABHA-452109', ekyc: 'Completed', enrol_date: '2025-02-28', approve_date: '2025-03-01' },
]

// ─── MP Claims & Payments ──────────────────────────────────────────────────

export const mpClaimsKPIs: KPI[] = [
  { label: 'Total Claims', value: '48,756', change: 4.8, color: 'blue' },
  { label: 'Claims Paid', value: '35,200', change: 6.1, color: 'green' },
  { label: 'Amount Paid', value: '₹125.4 Cr', change: 11.2, color: 'emerald' },
  { label: 'Preauth Approved', value: '44,800', change: 3.5, color: 'cyan' },
  { label: 'Portability Claims', value: '2,840', change: 15.6, color: 'purple' },
  { label: 'Pending Claims', value: '6,500', change: -8.2, color: 'orange' },
  { label: 'Rejected Claims', value: '3,556', change: -12.1, color: 'red' },
  { label: 'Avg Claim Amount', value: '₹35,625', change: 4.8, color: 'blue' },
]

export const mpClaimsMonthly: ChartDataPoint[] = [
  { name: 'Jan', paid: 3200, pending: 450, rejected: 180 },
  { name: 'Feb', paid: 3800, pending: 380, rejected: 210 },
  { name: 'Mar', paid: 4200, pending: 420, rejected: 190 },
  { name: 'Apr', paid: 4050, pending: 390, rejected: 205 },
  { name: 'May', paid: 4800, pending: 350, rejected: 160 },
  { name: 'Jun', paid: 5100, pending: 310, rejected: 145 },
  { name: 'Jul', paid: 5400, pending: 280, rejected: 138 },
  { name: 'Aug', paid: 4650, pending: 290, rejected: 128 },
]

export const mpClaimsAmountMonthly: ChartDataPoint[] = [
  { name: 'Jan', amount: 9.2 },
  { name: 'Feb', amount: 10.8 },
  { name: 'Mar', amount: 12.4 },
  { name: 'Apr', amount: 11.9 },
  { name: 'May', amount: 14.2 },
  { name: 'Jun', amount: 15.6 },
  { name: 'Jul', amount: 16.8 },
  { name: 'Aug', amount: 14.5 },
]

export const mpPaymentData: ChartDataPoint[] = [
  { name: 'Hospital Payment', value: 980000000 },
  { name: 'Beneficiary Refund', value: 85000000 },
  { name: 'TMS Recovery', value: 38000000 },
  { name: 'Portability', value: 64000000 },
  { name: 'State Top-up', value: 47000000 },
]

export const mpCaseTypeData: ChartDataPoint[] = [
  { name: 'Planned', value: 28400 },
  { name: 'Emergency', value: 14200 },
  { name: 'Portability', value: 2840 },
  { name: 'MORTH', value: 3316 },
]

export const mpDistrictClaimsData: ChartDataPoint[] = [
  { name: 'Bhopal', claims: 9850, amount: 18.5 },
  { name: 'Indore', claims: 11200, amount: 21.4 },
  { name: 'Jabalpur', claims: 7800, amount: 14.8 },
  { name: 'Gwalior', claims: 5900, amount: 11.2 },
  { name: 'Ujjain', claims: 4200, amount: 8.1 },
  { name: 'Sagar', claims: 3600, amount: 6.9 },
  { name: 'Rewa', claims: 3100, amount: 5.8 },
]

export const mpHospitalTypeClaimsData: ChartDataPoint[] = [
  { name: 'Government', claims: 21500, amount: 38.4 },
  { name: 'Private', claims: 18900, amount: 56.2 },
  { name: 'Trust', claims: 4800, amount: 15.8 },
  { name: 'Corporate', claims: 3556, amount: 15.0 },
]

export const mpAvgProcessingDays: ChartDataPoint[] = [
  { name: 'Bhopal', avg_days: 2.1 },
  { name: 'Indore', avg_days: 1.9 },
  { name: 'Jabalpur', avg_days: 2.8 },
  { name: 'Gwalior', avg_days: 3.1 },
  { name: 'Ujjain', avg_days: 2.5 },
  { name: 'Sagar', avg_days: 3.4 },
  { name: 'Rewa', avg_days: 3.8 },
]

export const mpClaimsTableData = [
  { case_id: 'MP-2025-08921', patient: 'Ram Singh', hospital_code: 'HOS-1201', hospital: 'CH Indore', district: 'Indore', case_type: 'Planned', procedure: 'Knee Replacement', status: 'Paid', preauth_date: '2025-06-01', surgery_dt: '2025-06-05', discharge_dt: '2025-06-10', claim_date: '2025-06-12', payment_dt: '2025-06-20', amount: '₹1,85,000' },
  { case_id: 'MP-2025-08922', patient: 'Geeta Bai', hospital_code: 'HOS-1202', hospital: 'MY Hospital Jabalpur', district: 'Jabalpur', case_type: 'Planned', procedure: 'Cataract Surgery', status: 'Paid', preauth_date: '2025-07-02', surgery_dt: '2025-07-05', discharge_dt: '2025-07-06', claim_date: '2025-07-08', payment_dt: '2025-07-18', amount: '₹28,000' },
  { case_id: 'MP-2025-08923', patient: 'Mohan Lal', hospital_code: 'HOS-1203', hospital: 'GMC Bhopal', district: 'Bhopal', case_type: 'Emergency', procedure: 'Hernia Repair', status: 'Pending', preauth_date: '2025-07-10', surgery_dt: '2025-07-11', discharge_dt: '2025-07-14', claim_date: '2025-07-16', payment_dt: '-', amount: '₹45,000' },
  { case_id: 'MP-2025-08924', patient: 'Kamla Devi', hospital_code: 'HOS-1204', hospital: 'District Hospital Gwalior', district: 'Gwalior', case_type: 'Planned', procedure: 'C-Section', status: 'Paid', preauth_date: '2025-05-20', surgery_dt: '2025-05-25', discharge_dt: '2025-05-28', claim_date: '2025-05-30', payment_dt: '2025-06-08', amount: '₹32,000' },
  { case_id: 'MP-2025-08925', patient: 'Suresh Yadav', hospital_code: 'HOS-1205', hospital: 'Civil Hospital Ujjain', district: 'Ujjain', case_type: 'Emergency', procedure: 'Angioplasty', status: 'Under Review', preauth_date: '2025-07-18', surgery_dt: '2025-07-18', discharge_dt: '2025-07-25', claim_date: '2025-07-27', payment_dt: '-', amount: '₹2,50,000' },
  { case_id: 'MP-2025-08926', patient: 'Ravi Sharma', hospital_code: 'HOS-1206', hospital: 'Apollo Bhopal', district: 'Bhopal', case_type: 'Planned', procedure: 'Hip Replacement', status: 'Approved', preauth_date: '2025-07-25', surgery_dt: '2025-07-30', discharge_dt: '2025-08-05', claim_date: '2025-08-07', payment_dt: '-', amount: '₹1,95,000' },
  { case_id: 'MP-2025-08927', patient: 'Meena Tiwari', hospital_code: 'HOS-1207', hospital: 'Choithram Hospital Indore', district: 'Indore', case_type: 'Portability', procedure: 'Dialysis', status: 'Paid', preauth_date: '2025-06-10', surgery_dt: '2025-06-12', discharge_dt: '2025-06-12', claim_date: '2025-06-14', payment_dt: '2025-06-22', amount: '₹18,500' },
  { case_id: 'MP-2025-08928', patient: 'Dinesh Patel', hospital_code: 'HOS-1208', hospital: 'RD Gardi Medical Ujjain', district: 'Ujjain', case_type: 'Planned', procedure: 'Appendectomy', status: 'Rejected', preauth_date: '2025-07-05', surgery_dt: '-', discharge_dt: '-', claim_date: '-', payment_dt: '-', amount: '₹35,000' },
  { case_id: 'MP-2025-08929', patient: 'Gita Mishra', hospital_code: 'HOS-1209', hospital: 'GMC Jabalpur', district: 'Jabalpur', case_type: 'Emergency', procedure: 'Skull Fracture', status: 'Paid', preauth_date: '2025-06-28', surgery_dt: '2025-06-28', discharge_dt: '2025-07-10', claim_date: '2025-07-12', payment_dt: '2025-07-22', amount: '₹3,20,000' },
  { case_id: 'MP-2025-08930', patient: 'Harish Kumar', hospital_code: 'HOS-1210', hospital: 'Arogya Hospital Sagar', district: 'Sagar', case_type: 'Planned', procedure: 'Gallbladder Removal', status: 'Approved', preauth_date: '2025-08-01', surgery_dt: '2025-08-05', discharge_dt: '2025-08-07', claim_date: '2025-08-09', payment_dt: '-', amount: '₹42,000' },
]

// ─── MP Hospitals ──────────────────────────────────────────────────────────

export const mpHospitalKPIs: KPI[] = [
  { label: 'Total Hospitals', value: '2,185', change: 1.8, color: 'blue' },
  { label: 'Active Hospitals', value: '2,020', change: 2.1, color: 'green' },
  { label: 'NABH Certified', value: '612', change: 5.2, color: 'emerald' },
  { label: 'De-empanelled', value: '48', change: -8.5, color: 'red' },
  { label: 'Govt Hospitals', value: '1,082', change: 0.8, color: 'cyan' },
  { label: 'Private Hospitals', value: '895', change: 3.2, color: 'purple' },
  { label: 'HEM Mapped', value: '2,045', change: 2.4, color: 'blue' },
  { label: 'Certs Expiring (30d)', value: '38', change: 12.5, color: 'orange' },
]

export const mpHospitalTypeData: ChartDataPoint[] = [
  { name: 'Government', value: 1082 },
  { name: 'Private', value: 895 },
  { name: 'Trust', value: 148 },
  { name: 'Corporate', value: 60 },
]

export const mpHospitalDistrictData: ChartDataPoint[] = [
  { name: 'Bhopal', hospitals: 215, certified: 58 },
  { name: 'Indore', hospitals: 248, certified: 72 },
  { name: 'Jabalpur', hospitals: 182, certified: 45 },
  { name: 'Gwalior', hospitals: 154, certified: 38 },
  { name: 'Ujjain', hospitals: 120, certified: 28 },
  { name: 'Sagar', hospitals: 95, certified: 18 },
  { name: 'Rewa', hospitals: 88, certified: 15 },
]

export const mpAccreditationData: ChartDataPoint[] = [
  { name: 'NABH Full', value: 312 },
  { name: 'NABH Entry', value: 300 },
  { name: 'NABL', value: 185 },
  { name: 'ISO Certified', value: 420 },
  { name: 'Not Certified', value: 968 },
]

export const mpEmpanelmentTrend: ChartDataPoint[] = [
  { name: 'Jan', empanelled: 18, deempanelled: 2 },
  { name: 'Feb', empanelled: 22, deempanelled: 1 },
  { name: 'Mar', empanelled: 28, deempanelled: 3 },
  { name: 'Apr', empanelled: 15, deempanelled: 2 },
  { name: 'May', empanelled: 32, deempanelled: 1 },
  { name: 'Jun', empanelled: 25, deempanelled: 4 },
  { name: 'Jul', empanelled: 19, deempanelled: 2 },
  { name: 'Aug', empanelled: 12, deempanelled: 1 },
]

export const mpSchemeHospitals: ChartDataPoint[] = [
  { name: 'Bhopal', pmjay: 180, state_scheme: 145 },
  { name: 'Indore', pmjay: 210, state_scheme: 170 },
  { name: 'Jabalpur', pmjay: 155, state_scheme: 118 },
  { name: 'Gwalior', pmjay: 130, state_scheme: 98 },
  { name: 'Ujjain', pmjay: 100, state_scheme: 75 },
]

export const mpDeempanelReasons: ChartDataPoint[] = [
  { name: 'Non-compliance', value: 18 },
  { name: 'Financial Fraud', value: 12 },
  { name: 'Quality Failure', value: 9 },
  { name: 'Voluntary Exit', value: 6 },
  { name: 'Expired Certificate', value: 3 },
]

export const mpHospitalSpecData: ChartDataPoint[] = [
  { name: 'Multi-Specialty', value: 890 },
  { name: 'Single Specialty', value: 648 },
  { name: 'General', value: 520 },
  { name: 'Dental', value: 127 },
]

export const mpHospitalTableData = [
  { code: 'HOS-MP-1201', facility_id: 'FAC-MP-01201', name: 'MY Hospital Jabalpur', type: 'Government', district: 'Jabalpur', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2019-04-01', deempanel_status: 'None', pgdnb_status: 'Yes' },
  { code: 'HOS-MP-1202', facility_id: 'FAC-MP-01202', name: 'CH Indore', type: 'Government', district: 'Indore', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2018-06-15', deempanel_status: 'None', pgdnb_status: 'Yes' },
  { code: 'HOS-MP-1203', facility_id: 'FAC-MP-01203', name: 'Apollo Hospital Bhopal', type: 'Private', district: 'Bhopal', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2018-10-01', deempanel_status: 'None', pgdnb_status: 'No' },
  { code: 'HOS-MP-1204', facility_id: 'FAC-MP-01204', name: 'District Hospital Gwalior', type: 'Government', district: 'Gwalior', spec_type: 'General', nabh: 'No', enrl_status: 'Active', active_status: 'Active', accreditation: 'ISO Certified', empaneled_date: '2020-01-10', deempanel_status: 'None', pgdnb_status: 'No' },
  { code: 'HOS-MP-1205', facility_id: 'FAC-MP-01205', name: 'City Hospital Ujjain', type: 'Private', district: 'Ujjain', spec_type: 'Single Specialty', nabh: 'No', enrl_status: 'De-empanelled', active_status: 'Inactive', accreditation: 'Not Certified', empaneled_date: '2021-03-15', deempanel_status: 'Financial Fraud', pgdnb_status: 'No' },
  { code: 'HOS-MP-1206', facility_id: 'FAC-MP-01206', name: 'RD Gardi Medical College', type: 'Trust', district: 'Ujjain', spec_type: 'Multi-Specialty', nabh: 'NABH Entry', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Entry', empaneled_date: '2019-07-20', deempanel_status: 'None', pgdnb_status: 'Yes' },
  { code: 'HOS-MP-1207', facility_id: 'FAC-MP-01207', name: 'Choithram Hospital Indore', type: 'Trust', district: 'Indore', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2018-04-05', deempanel_status: 'None', pgdnb_status: 'Yes' },
  { code: 'HOS-MP-1208', facility_id: 'FAC-MP-01208', name: 'GMC Bhopal', type: 'Government', district: 'Bhopal', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2017-12-01', deempanel_status: 'None', pgdnb_status: 'Yes' },
  { code: 'HOS-MP-1209', facility_id: 'FAC-MP-01209', name: 'CHL Hospital Indore', type: 'Private', district: 'Indore', spec_type: 'Multi-Specialty', nabh: 'NABH Full', enrl_status: 'Active', active_status: 'Active', accreditation: 'NABH Full', empaneled_date: '2020-05-10', deempanel_status: 'None', pgdnb_status: 'No' },
  { code: 'HOS-MP-1210', facility_id: 'FAC-MP-01210', name: 'Arogya Hospital Sagar', type: 'Private', district: 'Sagar', spec_type: 'Single Specialty', nabh: 'No', enrl_status: 'Active', active_status: 'Active', accreditation: 'Not Certified', empaneled_date: '2022-08-20', deempanel_status: 'None', pgdnb_status: 'No' },
]

/** dmart_mp.hospital_master — schema-shaped demo */
export const mpHospitalMasterTableData = mpHospitalTableData.map((h, i) => ({
  id_pk: i + 1,
  hospital_code: h.code,
  facility_id: h.facility_id,
  hospital_name: h.name,
  hospital_type: h.type,
  district_name: h.district,
  division_name: h.district,
  hosp_spec_type: h.spec_type,
  nabh_certified: h.nabh,
  enrl_status: h.enrl_status,
  active_status: h.active_status,
  accreditation_status: h.accreditation,
  empaneled_date: h.empaneled_date,
  deempanel_date: '',
  deempanel_status: h.deempanel_status,
  pgdnb_status: h.pgdnb_status,
  bed_capacity: 100 + i * 10,
}))

/** dmart_mp.workflow_users_t — schema-shaped demo for fraud module */
export const mpFraudWorkflowUsersTableData = [
  { id_pk: 1, table_name: 't_suspicious_api_case_data', registration_id: 'FRD-2025-001', workflow_role: 'SHA-AFO', workflow_user: 'sha.reviewer01', dashboard_workflow_role: 'SHA-AFO', status_descrption: 'Under Investigation', hospital_name: 'XYZ Hospital Indore', hospital_type: 'Private', initiated_amount: 450000, approved_amount: 0 },
  { id_pk: 2, table_name: 't_suspicious_api_case_data', registration_id: 'FRD-2025-002', workflow_role: 'SHA-AFO', workflow_user: 'sha.reviewer02', dashboard_workflow_role: 'SHA-AFO', status_descrption: 'Fraud Detected', hospital_name: 'ABC Clinic Bhopal', hospital_type: 'Private', initiated_amount: 280000, approved_amount: 280000 },
  { id_pk: 3, table_name: 't_suspicious_api_case_data', registration_id: 'FRD-2025-003', workflow_role: 'SHA-AFO', workflow_user: 'sha.reviewer03', dashboard_workflow_role: 'SHA-AFO', status_descrption: 'Under Process', hospital_name: 'DEF Medical Gwalior', hospital_type: 'Government', initiated_amount: 120000, approved_amount: 0 },
  { id_pk: 4, table_name: 't_suspicious_api_case_data', registration_id: 'FRD-2025-004', workflow_role: 'SHA-AFO', workflow_user: 'sha.reviewer04', dashboard_workflow_role: 'SHA-AFO', status_descrption: 'Fraud Detected', hospital_name: 'GHI Hospital Jabalpur', hospital_type: 'Private', initiated_amount: 650000, approved_amount: 325000 },
  { id_pk: 5, table_name: 't_suspicious_api_case_data', registration_id: 'FRD-2025-006', workflow_role: 'CPD', workflow_user: 'cpd.officer01', dashboard_workflow_role: 'CPD', status_descrption: 'Query II Pending', hospital_name: 'CHL Hospital Indore', hospital_type: 'Private', initiated_amount: 195000, approved_amount: 0 },
]

// ─── MP Patients & Treatment ─────────────────────────────────────────────────

export const mpPatientKPIs: KPI[] = [
  { label: 'Total Patients', value: '1,25,400', change: 6.8, color: 'blue' },
  { label: 'MORTH Patients', value: '8,450', change: 4.2, color: 'green' },
  { label: 'Total Treatments', value: '1,18,200', change: 5.5, color: 'emerald' },
  { label: 'Avg Treatment Cost', value: '₹42,500', change: 1.8, color: 'purple' },
  { label: 'Inpatient', value: '98,400', change: 7.2, color: 'cyan' },
  { label: 'Outpatient', value: '26,900', change: 4.1, color: 'blue' },
  { label: 'Discharged', value: '1,10,200', change: 6.4, color: 'green' },
]

export const mpTreatmentData: ChartDataPoint[] = [
  { name: 'Ophthalmology', patients: 22100 },
  { name: 'Cardiology', patients: 18500 },
  { name: 'Orthopedics', patients: 15200 },
  { name: 'General Surgery', patients: 16800 },
  { name: 'Obstetrics', patients: 12400 },
  { name: 'Oncology', patients: 8900 },
  { name: 'Neurology', patients: 7500 },
  { name: 'Others', patients: 24000 },
]

export const mpTreatmentCostData: ChartDataPoint[] = [
  { name: 'Cardiology', avg_cost: 112000 },
  { name: 'Orthopedics', avg_cost: 98500 },
  { name: 'Neurology', avg_cost: 85000 },
  { name: 'Oncology', avg_cost: 72000 },
  { name: 'General Surgery', avg_cost: 38000 },
  { name: 'Obstetrics', avg_cost: 28500 },
  { name: 'Ophthalmology', avg_cost: 22000 },
]

export const mpAdmissionTrend: ChartDataPoint[] = [
  { name: 'Jan', admissions: 12500, discharges: 12100 },
  { name: 'Feb', admissions: 13800, discharges: 13400 },
  { name: 'Mar', admissions: 15200, discharges: 14900 },
  { name: 'Apr', admissions: 14100, discharges: 13800 },
  { name: 'May', admissions: 16800, discharges: 16500 },
  { name: 'Jun', admissions: 17500, discharges: 17100 },
  { name: 'Jul', admissions: 18200, discharges: 17800 },
  { name: 'Aug', admissions: 17300, discharges: 16900 },
]

export const mpAdmissionTypeData: ChartDataPoint[] = [
  { name: 'Planned', value: 82400 },
  { name: 'Emergency', value: 36000 },
  { name: 'MORTH', value: 7000 },
]

export const mpTopIcdData: ChartDataPoint[] = [
  { name: 'H26 - Cataract', value: 18200 },
  { name: 'I25 - Coronary Artery', value: 14500 },
  { name: 'M17 - Knee Arthrosis', value: 11800 },
  { name: 'O82 - C-Section', value: 9600 },
  { name: 'K40 - Inguinal Hernia', value: 8900 },
  { name: 'Z51 - Chemotherapy', value: 7200 },
  { name: 'G20 - Parkinson\'s', value: 5800 },
]

export const mpPatientDistrictData: ChartDataPoint[] = [
  { name: 'Indore', patients: 24500 },
  { name: 'Bhopal', patients: 22800 },
  { name: 'Jabalpur', patients: 18600 },
  { name: 'Gwalior', patients: 14200 },
  { name: 'Ujjain', patients: 10900 },
  { name: 'Sagar', patients: 8400 },
  { name: 'Rewa', patients: 7100 },
]

export const mpDischargeTypeData: ChartDataPoint[] = [
  { name: 'Recovered', value: 98400 },
  { name: 'Referred', value: 7200 },
  { name: 'LAMA', value: 3800 },
  { name: 'Death', value: 800 },
]

export const mpPatientTableData = [
  { patient_id: 'PAT-MP-78201', name: 'Anil Verma', registration_id: 'REG-52001', case_id: 'MP-2025-08921', hospital: 'CH Indore', district: 'Indore', treatment: 'Knee Replacement', icd_code: 'M17.1', admission_dt: '2025-06-05', discharge_dt: '2025-06-10', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹1,85,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78202', name: 'Meena Kumari', registration_id: 'REG-52002', case_id: 'MP-2025-08922', hospital: 'MY Hospital Jabalpur', district: 'Jabalpur', treatment: 'Cataract Surgery', icd_code: 'H26.0', admission_dt: '2025-07-05', discharge_dt: '2025-07-06', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹28,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78203', name: 'Dinesh Rao', registration_id: 'REG-52003', case_id: 'MP-2025-08925', hospital: 'Apollo Bhopal', district: 'Bhopal', treatment: 'Angioplasty', icd_code: 'I25.1', admission_dt: '2025-07-18', discharge_dt: '2025-07-25', admission_type: 'Emergency', discharge_type: 'Recovered', cost: '₹2,50,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78204', name: 'Pooja Sharma', registration_id: 'REG-52004', case_id: 'MP-2025-08924', hospital: 'GMC Gwalior', district: 'Gwalior', treatment: 'C-Section', icd_code: 'O82.0', admission_dt: '2025-05-25', discharge_dt: '2025-05-28', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹32,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78205', name: 'Harish Malviya', registration_id: 'REG-52005', case_id: 'MP-2025-08923', hospital: 'Civil Hospital Ujjain', district: 'Ujjain', treatment: 'Hernia Repair', icd_code: 'K40.2', admission_dt: '2025-07-11', discharge_dt: '2025-07-14', admission_type: 'Emergency', discharge_type: 'Recovered', cost: '₹45,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78206', name: 'Sunita Rawat', registration_id: 'REG-52006', case_id: 'MP-2025-08929', hospital: 'GMC Jabalpur', district: 'Jabalpur', treatment: 'Skull Fracture Surgery', icd_code: 'S02.0', admission_dt: '2025-06-28', discharge_dt: '2025-07-10', admission_type: 'Emergency', discharge_type: 'Recovered', cost: '₹3,20,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78207', name: 'Ravi Gupta', registration_id: 'REG-52007', case_id: 'MP-2025-08926', hospital: 'Apollo Bhopal', district: 'Bhopal', treatment: 'Hip Replacement', icd_code: 'M16.1', admission_dt: '2025-07-30', discharge_dt: '2025-08-05', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹1,95,000', status: 'Discharged' },
  { patient_id: 'PAT-MP-78208', name: 'Meena Tiwari', registration_id: 'REG-52008', case_id: 'MP-2025-08927', hospital: 'Choithram Indore', district: 'Indore', treatment: 'Dialysis Session', icd_code: 'Z49.1', admission_dt: '2025-06-12', discharge_dt: '2025-06-12', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹18,500', status: 'Discharged' },
  { patient_id: 'PAT-MP-78209', name: 'Deepak Sahu', registration_id: 'REG-52009', case_id: 'MP-2025-09001', hospital: 'CHL Hospital Indore', district: 'Indore', treatment: 'Chemotherapy', icd_code: 'Z51.1', admission_dt: '2025-08-01', discharge_dt: '-', admission_type: 'Planned', discharge_type: '-', cost: '₹85,000', status: 'Admitted' },
  { patient_id: 'PAT-MP-78210', name: 'Shobha Singh', registration_id: 'REG-52010', case_id: 'MP-2025-08930', hospital: 'Arogya Hospital Sagar', district: 'Sagar', treatment: 'Cholecystectomy', icd_code: 'K80.1', admission_dt: '2025-08-05', discharge_dt: '2025-08-07', admission_type: 'Planned', discharge_type: 'Recovered', cost: '₹42,000', status: 'Discharged' },
]

// ─── MP Fraud & Audit ──────────────────────────────────────────────────────

export const mpFraudKPIs: KPI[] = [
  { label: 'Total Suspicious Cases', value: '342', change: -12.5, color: 'red' },
  { label: 'Under Investigation', value: '128', change: 5.2, color: 'orange' },
  { label: 'Confirmed Fraud', value: '52', change: -8.1, color: 'red' },
  { label: 'Cleared', value: '162', change: 18.4, color: 'green' },
  { label: 'Amount at Risk', value: '₹8.4 Cr', change: -4.2, color: 'orange' },
  { label: 'Amount Recovered', value: '₹3.2 Cr', change: 22.6, color: 'emerald' },
  { label: 'High-Risk Hospitals', value: '18', change: -15.0, color: 'red' },
  { label: 'Audit Transactions', value: '45,600', change: 6.1, color: 'blue' },
]

export const mpFraudTrend: ChartDataPoint[] = [
  { name: 'Jan', suspicious: 42, confirmed: 6 },
  { name: 'Feb', suspicious: 38, confirmed: 5 },
  { name: 'Mar', suspicious: 55, confirmed: 9 },
  { name: 'Apr', suspicious: 48, confirmed: 7 },
  { name: 'May', suspicious: 35, confirmed: 4 },
  { name: 'Jun', suspicious: 52, confirmed: 8 },
  { name: 'Jul', suspicious: 40, confirmed: 6 },
  { name: 'Aug', suspicious: 32, confirmed: 7 },
]

export const mpFraudTypeData: ChartDataPoint[] = [
  { name: 'Duplicate Claim', value: 98 },
  { name: 'Overbilling', value: 82 },
  { name: 'Ghost Patient', value: 68 },
  { name: 'Fake Documents', value: 54 },
  { name: 'Procedure Mismatch', value: 40 },
]

export const mpFraudRecoveredTrend: ChartDataPoint[] = [
  { name: 'Jan', recovered: 18.5 },
  { name: 'Feb', recovered: 22.4 },
  { name: 'Mar', recovered: 28.1 },
  { name: 'Apr', recovered: 24.6 },
  { name: 'May', recovered: 32.8 },
  { name: 'Jun', recovered: 41.2 },
  { name: 'Jul', recovered: 38.5 },
  { name: 'Aug', recovered: 54.9 },
]

export const mpFraudEntityData: ChartDataPoint[] = [
  { name: 'Hospital', value: 215 },
  { name: 'User', value: 82 },
  { name: 'Beneficiary', value: 45 },
]

export const mpFraudDistrictData: ChartDataPoint[] = [
  { name: 'Indore', value: 78 },
  { name: 'Bhopal', value: 65 },
  { name: 'Jabalpur', value: 52 },
  { name: 'Gwalior', value: 45 },
  { name: 'Ujjain', value: 38 },
  { name: 'Sagar', value: 34 },
  { name: 'Rewa', value: 30 },
]

export const mpAuditStageData: ChartDataPoint[] = [
  { name: 'SHA Approved', value: 28500 },
  { name: 'ACO Approved', value: 9400 },
  { name: 'CPD Approved', value: 4800 },
  { name: 'Pending Review', value: 2900 },
]

export const mpFraudTableData = [
  { suspicion_id: 1, reference_number: 'FRD-2025-001', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1225', hospital_name: 'XYZ Hospital Indore', division_name: 'Indore', district_name: 'Indore', state_lgd_code: '23', fraud_type: 'Duplicate Claim', investigation_status: 'Under Investigation', amount_risk: 450000, amount_recovered: 0, investigator: 'Dr. Sunita Patel', lst_trigger_event_date: '2025-06-10', crt_date: '2025-06-10', updt_date: '2025-06-12' },
  { suspicion_id: 2, reference_number: 'FRD-2025-002', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1126', hospital_name: 'ABC Clinic Bhopal', division_name: 'Bhopal', district_name: 'Bhopal', state_lgd_code: '23', fraud_type: 'Fake Documents', investigation_status: 'Fraud Detected', amount_risk: 280000, amount_recovered: 280000, investigator: 'Dr. Rajesh Kumar', lst_trigger_event_date: '2025-05-15', crt_date: '2025-05-15', updt_date: '2025-06-02' },
  { suspicion_id: 3, reference_number: 'FRD-2025-003', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1315', hospital_name: 'DEF Medical Gwalior', division_name: 'Gwalior', district_name: 'Gwalior', state_lgd_code: '23', fraud_type: 'Overbilling', investigation_status: 'Under Process', amount_risk: 120000, amount_recovered: 0, investigator: 'Dr. Amit Singh', lst_trigger_event_date: '2025-07-01', crt_date: '2025-07-01', updt_date: '2025-07-05' },
  { suspicion_id: 4, reference_number: 'FRD-2025-004', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1408', hospital_name: 'GHI Hospital Jabalpur', division_name: 'Jabalpur', district_name: 'Jabalpur', state_lgd_code: '23', fraud_type: 'Ghost Patient', investigation_status: 'Fraud Detected', amount_risk: 650000, amount_recovered: 325000, investigator: 'Dr. Priya Sharma', lst_trigger_event_date: '2025-04-20', crt_date: '2025-04-20', updt_date: '2025-05-18' },
  { suspicion_id: 5, reference_number: 'FRD-2025-005', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1502', hospital_name: 'JKL Clinic Ujjain', division_name: 'Ujjain', district_name: 'Ujjain', state_lgd_code: '23', fraud_type: 'Procedure Mismatch', investigation_status: 'Non-Fraud', amount_risk: 85000, amount_recovered: 0, investigator: 'Dr. Vikram Joshi', lst_trigger_event_date: '2025-06-05', crt_date: '2025-06-05', updt_date: '2025-06-20' },
  { suspicion_id: 6, reference_number: 'FRD-2025-006', application_type: 'CLAIM', entity_type: 'User', entity_id: 'USR-00512', hospital_name: 'CHL Hospital Indore', division_name: 'Indore', district_name: 'Indore', state_lgd_code: '23', fraud_type: 'Duplicate Claim', investigation_status: 'Query II Pending', amount_risk: 195000, amount_recovered: 0, investigator: 'Dr. Sunita Patel', lst_trigger_event_date: '2025-07-12', crt_date: '2025-07-12', updt_date: '2025-07-14' },
  { suspicion_id: 7, reference_number: 'FRD-2025-007', application_type: 'ENROLMENT', entity_type: 'Hospital', entity_id: 'HOS-MP-1612', hospital_name: 'MNO Hospital Sagar', division_name: 'Sagar', district_name: 'Sagar', state_lgd_code: '23', fraud_type: 'Overbilling', investigation_status: 'Non-Fraud', amount_risk: 320000, amount_recovered: 0, investigator: 'Dr. Amit Singh', lst_trigger_event_date: '2025-05-28', crt_date: '2025-05-28', updt_date: '2025-06-10' },
  { suspicion_id: 8, reference_number: 'FRD-2025-008', application_type: 'CLAIM', entity_type: 'Hospital', entity_id: 'HOS-MP-1218', hospital_name: 'PQR Medical Rewa', division_name: 'Rewa', district_name: 'Rewa', state_lgd_code: '23', fraud_type: 'Fake Documents', investigation_status: 'Query I Pending', amount_risk: 580000, amount_recovered: 0, investigator: 'Dr. Rajesh Kumar', lst_trigger_event_date: '2025-07-25', crt_date: '2025-07-25', updt_date: '2025-07-26' },
]

/** t_suspicious_api_case_dtls — rule-trigger detail rows linked by reference_number */
export const mpFraudTriggerTypeData: ChartDataPoint[] = [
  { name: 'GEO-MISMATCH', value: 86 },
  { name: 'DUP-CLAIM', value: 74 },
  { name: 'DEVICE-SHARE', value: 58 },
  { name: 'PKG-MISMATCH', value: 45 },
  { name: 'DOC-ANOMALY', value: 39 },
  { name: 'AMOUNT-SPIKE', value: 28 },
]

export const mpFraudAppTypeData: ChartDataPoint[] = [
  { name: 'CLAIM', value: 168 },
  { name: 'ENROLMENT', value: 92 },
  { name: 'CARD', value: 54 },
  { name: 'PREAUTH', value: 36 },
]

export const mpFraudTriggerTableData = [
  { id_pk: 10045821, state_lgd_code: '23', reference_number: 'FRD-2025-001', application_type: 'CLAIM', vendor_id: 'VEND001', trigger_type: 'DUP-CLAIM', trigger_code: 'DUP-CLAIM-01', trigger_time: '2025-06-10 09:12:00', trigger_reason: 'Multiple claims with identical package and beneficiary within 48 hrs', crt_date: '2025-06-10', crt_usr: 'sha.reviewer01', flag: 'ACTIVE', district_name: 'Indore' },
  { id_pk: 10045822, state_lgd_code: '23', reference_number: 'FRD-2025-001', application_type: 'CLAIM', vendor_id: 'VEND001', trigger_type: 'DEVICE-SHARE', trigger_code: 'DEV-SHARE-03', trigger_time: '2025-06-10 09:14:22', trigger_reason: 'Same device ID used across multiple hospital logins', crt_date: '2025-06-10', crt_usr: 'system.api', flag: 'ACTIVE', district_name: 'Indore' },
  { id_pk: 10045830, state_lgd_code: '23', reference_number: 'FRD-2025-002', application_type: 'CLAIM', vendor_id: 'VEND002', trigger_type: 'DOC-ANOMALY', trigger_code: 'DOC-FAKE-02', trigger_time: '2025-05-15 11:05:10', trigger_reason: 'Uploaded documents failed OCR authenticity checks', crt_date: '2025-05-15', crt_usr: 'sha.reviewer02', flag: 'CONFIRMED', district_name: 'Bhopal' },
  { id_pk: 10045841, state_lgd_code: '23', reference_number: 'FRD-2025-003', application_type: 'CLAIM', vendor_id: 'VEND001', trigger_type: 'AMOUNT-SPIKE', trigger_code: 'AMT-SPIKE-04', trigger_time: '2025-07-01 14:22:45', trigger_reason: 'Claim amount 3.2x hospital historical average for package', crt_date: '2025-07-01', crt_usr: 'system.api', flag: 'ACTIVE', district_name: 'Gwalior' },
  { id_pk: 10045855, state_lgd_code: '23', reference_number: 'FRD-2025-004', application_type: 'CLAIM', vendor_id: 'VEND003', trigger_type: 'GEO-MISMATCH', trigger_code: 'GEO-MIS-01', trigger_time: '2025-04-20 08:40:18', trigger_reason: 'Beneficiary geo location differs from hospital district', crt_date: '2025-04-20', crt_usr: 'system.api', flag: 'CONFIRMED', district_name: 'Jabalpur' },
  { id_pk: 10045856, state_lgd_code: '23', reference_number: 'FRD-2025-004', application_type: 'PREAUTH', vendor_id: 'VEND003', trigger_type: 'PKG-MISMATCH', trigger_code: 'PKG-MIS-07', trigger_time: '2025-04-20 08:41:02', trigger_reason: 'Preauth package does not match final claim package', crt_date: '2025-04-20', crt_usr: 'aco.officer03', flag: 'CONFIRMED', district_name: 'Jabalpur' },
  { id_pk: 10045870, state_lgd_code: '23', reference_number: 'FRD-2025-005', application_type: 'CLAIM', vendor_id: 'VEND002', trigger_type: 'PKG-MISMATCH', trigger_code: 'PKG-MIS-02', trigger_time: '2025-06-05 16:10:33', trigger_reason: 'Procedure code mismatch with specialty of hospital', crt_date: '2025-06-05', crt_usr: 'system.api', flag: 'CLEARED', district_name: 'Ujjain' },
  { id_pk: 10045888, state_lgd_code: '23', reference_number: 'FRD-2025-006', application_type: 'CLAIM', vendor_id: 'VEND001', trigger_type: 'DUP-CLAIM', trigger_code: 'DUP-CLAIM-05', trigger_time: '2025-07-12 10:05:55', trigger_reason: 'Same claim submitted by multiple system users', crt_date: '2025-07-12', crt_usr: 'sha.reviewer01', flag: 'ACTIVE', district_name: 'Bhopal' },
  { id_pk: 10045901, state_lgd_code: '23', reference_number: 'FRD-2025-007', application_type: 'ENROLMENT', vendor_id: 'VEND004', trigger_type: 'DEVICE-SHARE', trigger_code: 'DEV-SHARE-01', trigger_time: '2025-05-28 12:30:00', trigger_reason: 'Enrolment device reused across unrelated families', crt_date: '2025-05-28', crt_usr: 'system.api', flag: 'CLEARED', district_name: 'Sagar' },
  { id_pk: 10045920, state_lgd_code: '23', reference_number: 'FRD-2025-008', application_type: 'CARD', vendor_id: 'VEND002', trigger_type: 'DOC-ANOMALY', trigger_code: 'DOC-FAKE-08', trigger_time: '2025-07-25 09:48:12', trigger_reason: 'Aadhaar photo mismatch during card generation', crt_date: '2025-07-25', crt_usr: 'bis.operator04', flag: 'ACTIVE', district_name: 'Rewa' },
  { id_pk: 10045921, state_lgd_code: '23', reference_number: 'FRD-2025-008', application_type: 'CLAIM', vendor_id: 'VEND001', trigger_type: 'GEO-MISMATCH', trigger_code: 'GEO-MIS-03', trigger_time: '2025-07-25 09:50:40', trigger_reason: 'Claim geo-tag outside assigned district boundary', crt_date: '2025-07-25', crt_usr: 'system.api', flag: 'ACTIVE', district_name: 'Rewa' },
  { id_pk: 10045940, state_lgd_code: '23', reference_number: 'FRD-2025-002', application_type: 'CLAIM', vendor_id: 'VEND002', trigger_type: 'AMOUNT-SPIKE', trigger_code: 'AMT-SPIKE-01', trigger_time: '2025-05-16 07:15:00', trigger_reason: 'Recovered amount equals full risk amount after confirmation', crt_date: '2025-05-16', crt_usr: 'sha.reviewer02', flag: 'CONFIRMED', district_name: 'Bhopal' },
]

// ─── MP Users & Workflow ───────────────────────────────────────────────────

export const mpUsersKPIs: KPI[] = [
  { label: 'Workflow Users', value: '4,250', change: 3.2, color: 'blue' },
  { label: 'Active Today', value: '1,820', change: 8.5, color: 'green' },
  { label: 'Transactions (MTD)', value: '45,600', change: 6.1, color: 'purple' },
  { label: 'Avg Processing Time', value: '2.4 hrs', change: -15.2, color: 'emerald' },
  { label: 'Pending Approvals', value: '1,248', change: -12.4, color: 'orange' },
  { label: 'Auto-Approved', value: '8,920', change: 18.5, color: 'cyan' },
]

export const mpWorkflowStatus: ChartDataPoint[] = [
  { name: 'Completed', value: 38500 },
  { name: 'In Progress', value: 4200 },
  { name: 'Pending Approval', value: 2100 },
  { name: 'Rejected', value: 800 },
]

export const mpRoleDistribution: ChartDataPoint[] = [
  { name: 'Data Entry Operator', value: 1850 },
  { name: 'Medical Officer', value: 980 },
  { name: 'District Coordinator', value: 640 },
  { name: 'Hospital User', value: 480 },
  { name: 'Audit Officer', value: 180 },
  { name: 'State Admin', value: 120 },
]

export const mpRoleTransactionData: ChartDataPoint[] = [
  { name: 'Data Entry', transactions: 22400, avg_time: 1.2 },
  { name: 'Medical Officer', transactions: 12800, avg_time: 3.5 },
  { name: 'Dist. Coord.', transactions: 6200, avg_time: 2.8 },
  { name: 'Audit Officer', transactions: 3100, avg_time: 4.2 },
  { name: 'State Admin', transactions: 1100, avg_time: 5.8 },
]

export const mpDailyTransactionTrend: ChartDataPoint[] = [
  { name: 'Mon', transactions: 8200 },
  { name: 'Tue', transactions: 9100 },
  { name: 'Wed', transactions: 8800 },
  { name: 'Thu', transactions: 9600 },
  { name: 'Fri', transactions: 7900 },
  { name: 'Sat', transactions: 1800 },
  { name: 'Sun', transactions: 200 },
]

export const mpProcessingTimeByRole: ChartDataPoint[] = [
  { name: 'State Admin', avg_hrs: 5.8 },
  { name: 'Audit Officer', avg_hrs: 4.2 },
  { name: 'Medical Officer', avg_hrs: 3.5 },
  { name: 'Dist. Coord.', avg_hrs: 2.8 },
  { name: 'Data Entry', avg_hrs: 1.2 },
]

export const mpUsersTableData = [
  { user_id: 'USR-001', name: 'Dr. Rajesh Kumar', role: 'Medical Officer', department: 'Claims', district: 'Bhopal', transactions: 1842, avg_time: '3.2 hrs', status: 'Active', last_login: '2025-08-13', pending: 28 },
  { user_id: 'USR-002', name: 'Priya Sharma', role: 'Data Entry Operator', department: 'BIS', district: 'Indore', transactions: 3650, avg_time: '1.1 hrs', status: 'Active', last_login: '2025-08-13', pending: 12 },
  { user_id: 'USR-003', name: 'Amit Singh', role: 'District Coordinator', department: 'Empanelment', district: 'Jabalpur', transactions: 820, avg_time: '2.6 hrs', status: 'Active', last_login: '2025-08-12', pending: 35 },
  { user_id: 'USR-004', name: 'Sunita Patel', role: 'Audit Officer', department: 'Fraud', district: 'Gwalior', transactions: 345, avg_time: '4.1 hrs', status: 'Active', last_login: '2025-08-13', pending: 18 },
  { user_id: 'USR-005', name: 'Vikram Joshi', role: 'State Admin', department: 'Admin', district: 'Bhopal', transactions: 156, avg_time: '6.2 hrs', status: 'Inactive', last_login: '2025-08-01', pending: 0 },
  { user_id: 'USR-006', name: 'Neha Gupta', role: 'Data Entry Operator', department: 'Claims', district: 'Ujjain', transactions: 2980, avg_time: '1.3 hrs', status: 'Active', last_login: '2025-08-13', pending: 8 },
  { user_id: 'USR-007', name: 'Suresh Yadav', role: 'Medical Officer', department: 'Claims', district: 'Sagar', transactions: 1245, avg_time: '3.8 hrs', status: 'Active', last_login: '2025-08-12', pending: 42 },
  { user_id: 'USR-008', name: 'Kavita Singh', role: 'District Coordinator', department: 'BIS', district: 'Rewa', transactions: 692, avg_time: '2.9 hrs', status: 'Active', last_login: '2025-08-11', pending: 25 },
]

// ─── MP LMS Training ───────────────────────────────────────────────────────

export const mpLmsKPIs: KPI[] = [
  { label: 'Total Enrolled', value: '8,450', change: 12.5, color: 'blue' },
  { label: 'AB-PMJAY Completed', value: '6,200', change: 8.8, color: 'green' },
  { label: 'ABDM Completed', value: '5,840', change: 11.2, color: 'emerald' },
  { label: 'Both Completed', value: '5,420', change: 14.2, color: 'cyan' },
  { label: 'In Progress', value: '1,850', change: -5.2, color: 'orange' },
  { label: 'Not Started', value: '400', change: -22.8, color: 'red' },
  { label: 'PMJAY Completion Rate', value: '73.4%', change: 2.1, color: 'purple' },
  { label: 'ABDM Completion Rate', value: '69.1%', change: 3.8, color: 'blue' },
]

export const mpLmsCourseData: ChartDataPoint[] = [
  { name: 'Claims Processing', pmjay_enrolled: 3200, pmjay_completed: 2450, abdm_enrolled: 2800, abdm_completed: 2100 },
  { name: 'eKYC Training', pmjay_enrolled: 2800, pmjay_completed: 2100, abdm_enrolled: 2400, abdm_completed: 1900 },
  { name: 'Hospital Empanelment', pmjay_enrolled: 1500, pmjay_completed: 980, abdm_enrolled: 1200, abdm_completed: 820 },
  { name: 'Fraud Detection', pmjay_enrolled: 950, pmjay_completed: 670, abdm_enrolled: 900, abdm_completed: 620 },
]

export const mpLmsCompletionTrend: ChartDataPoint[] = [
  { name: 'Jan', pmjay: 520, abdm: 480 },
  { name: 'Feb', pmjay: 640, abdm: 590 },
  { name: 'Mar', pmjay: 780, abdm: 720 },
  { name: 'Apr', pmjay: 720, abdm: 665 },
  { name: 'May', pmjay: 920, abdm: 850 },
  { name: 'Jun', pmjay: 1050, abdm: 980 },
  { name: 'Jul', pmjay: 980, abdm: 920 },
  { name: 'Aug', pmjay: 590, abdm: 635 },
]

export const mpLmsRoleStatusData: ChartDataPoint[] = [
  { name: 'Data Entry', completed: 1650, in_progress: 480, not_started: 120 },
  { name: 'Medical Officer', completed: 920, in_progress: 280, not_started: 80 },
  { name: 'Dist. Coord.', completed: 580, in_progress: 165, not_started: 45 },
  { name: 'Audit Officer', completed: 162, in_progress: 52, not_started: 18 },
  { name: 'State Admin', completed: 108, in_progress: 30, not_started: 12 },
]

export const mpLmsEntityTypeData: ChartDataPoint[] = [
  { name: 'Hospital Staff', value: 5200 },
  { name: 'District Admin', value: 1820 },
  { name: 'State Admin', value: 680 },
  { name: 'Other', value: 750 },
]

export const mpLmsStateWiseData: ChartDataPoint[] = [
  { name: 'Bhopal', completion_rate: 82 },
  { name: 'Indore', completion_rate: 79 },
  { name: 'Jabalpur', completion_rate: 71 },
  { name: 'Gwalior', completion_rate: 68 },
  { name: 'Ujjain', completion_rate: 65 },
  { name: 'Sagar', completion_rate: 58 },
  { name: 'Rewa', completion_rate: 54 },
]

export const mpLmsTableData = [
  { userid: 'LMS-10001', name: 'Rajesh Kumar', role: 'Medical Officer', entity: 'GMC Bhopal', parententity: 'Bhopal District', entitytype: 'Hospital', ab_pmjay_status: 'Completed', abdm_status: 'Completed', ab_pmjay_completed: '2025-07-15', abdm_completed: '2025-07-20' },
  { userid: 'LMS-10002', name: 'Priya Sharma', role: 'Data Entry Operator', entity: 'BIS Office Indore', parententity: 'Indore District', entitytype: 'State', ab_pmjay_status: 'In Progress', abdm_status: 'Completed', ab_pmjay_completed: '-', abdm_completed: '2025-07-10' },
  { userid: 'LMS-10003', name: 'Amit Singh', role: 'District Coordinator', entity: 'District Health Office', parententity: 'Jabalpur District', entitytype: 'District', ab_pmjay_status: 'Completed', abdm_status: 'Completed', ab_pmjay_completed: '2025-07-20', abdm_completed: '2025-07-25' },
  { userid: 'LMS-10004', name: 'Sunita Patel', role: 'Audit Officer', entity: 'SHA MP', parententity: 'State Level', entitytype: 'State', ab_pmjay_status: 'In Progress', abdm_status: 'In Progress', ab_pmjay_completed: '-', abdm_completed: '-' },
  { userid: 'LMS-10005', name: 'Vikram Joshi', role: 'State Admin', entity: 'SHA MP', parententity: 'State Level', entitytype: 'State', ab_pmjay_status: 'Completed', abdm_status: 'Completed', ab_pmjay_completed: '2025-06-28', abdm_completed: '2025-06-30' },
  { userid: 'LMS-10006', name: 'Neha Gupta', role: 'Data Entry Operator', entity: 'Civil Hospital Ujjain', parententity: 'Ujjain District', entitytype: 'Hospital', ab_pmjay_status: 'Completed', abdm_status: 'Not Started', ab_pmjay_completed: '2025-08-01', abdm_completed: '-' },
  { userid: 'LMS-10007', name: 'Suresh Yadav', role: 'Medical Officer', entity: 'Arogya Hospital Sagar', parententity: 'Sagar District', entitytype: 'Hospital', ab_pmjay_status: 'Not Started', abdm_status: 'Not Started', ab_pmjay_completed: '-', abdm_completed: '-' },
  { userid: 'LMS-10008', name: 'Kavita Singh', role: 'District Coordinator', entity: 'District Health Office', parententity: 'Rewa District', entitytype: 'District', ab_pmjay_status: 'Completed', abdm_status: 'In Progress', ab_pmjay_completed: '2025-07-18', abdm_completed: '-' },
  { userid: 'LMS-10009', name: 'Mohan Rawat', role: 'Hospital User', entity: 'Choithram Hospital Indore', parententity: 'Indore District', entitytype: 'Hospital', ab_pmjay_status: 'Completed', abdm_status: 'Completed', ab_pmjay_completed: '2025-06-15', abdm_completed: '2025-06-20' },
  { userid: 'LMS-10010', name: 'Geeta Tiwari', role: 'Data Entry Operator', entity: 'CH Gwalior', parententity: 'Gwalior District', entitytype: 'Hospital', ab_pmjay_status: 'In Progress', abdm_status: 'Completed', ab_pmjay_completed: '-', abdm_completed: '2025-07-30' },
]

// ─── UMP User Master ───────────────────────────────────────────────────────

export const umpKPIs: KPI[] = [
  { label: 'Total Users', value: '15,420', change: 2.8, color: 'blue' },
  { label: 'Active Users', value: '12,850', change: 4.1, color: 'green' },
  { label: 'New Users (MTD)', value: '420', change: 18.5, color: 'purple' },
  { label: 'Roles Defined', value: '28', change: 0, color: 'orange' },
]

export const umpRoleDistribution: ChartDataPoint[] = [
  { name: 'Data Entry', value: 5200 },
  { name: 'Medical Officer', value: 2800 },
  { name: 'District Admin', value: 1850 },
  { name: 'State Admin', value: 120 },
  { name: 'Hospital User', value: 4200 },
  { name: 'Others', value: 1250 },
]

export const umpUsersTableData = [
  { user_id: 'UMP-10001', name: 'Admin User', role: 'State Admin', state: 'Madhya Pradesh', status: 'Active', created: '2024-01-15' },
  { user_id: 'UMP-10002', name: 'Dr. Mehta', role: 'Medical Officer', state: 'Madhya Pradesh', status: 'Active', created: '2024-03-20' },
  { user_id: 'UMP-10003', name: 'Data Operator 1', role: 'Data Entry', state: 'Madhya Pradesh', status: 'Active', created: '2024-06-10' },
  { user_id: 'UMP-10004', name: 'District Coordinator', role: 'District Admin', state: 'Madhya Pradesh', status: 'Active', created: '2024-08-05' },
  { user_id: 'UMP-10005', name: 'Hospital Admin', role: 'Hospital User', state: 'Madhya Pradesh', status: 'Inactive', created: '2025-01-12' },
]
