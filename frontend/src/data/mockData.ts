import type { ChartDataPoint, KPI } from '../types'

// ─── Overview / Landing Page ───────────────────────────────────────────────

export const overviewKPIs: KPI[] = [
  { label: 'Total Beneficiaries', value: '12,45,320', change: 8.2, changeLabel: 'vs last month', color: 'blue', link: '/dashboard/mp/beneficiaries' },
  { label: 'Total Claims', value: '48,756', change: 5.4, changeLabel: 'vs last month', color: 'green', link: '/dashboard/mp/claims-payments' },
  { label: 'Claims Paid Amount', value: '₹125.4 Cr', change: 12.1, changeLabel: 'vs last month', color: 'emerald', link: '/dashboard/mp/claims-payments' },
  { label: 'Cards Printed', value: '9,82,450', change: 3.7, changeLabel: 'vs last month', color: 'purple', link: '/dashboard/bis/card-printing' },
  { label: 'Hospitals Empanelled', value: '3,248', change: 1.2, changeLabel: 'vs last month', color: 'orange', link: '/dashboard/mp/hospitals' },
  { label: 'Active Users (UMP)', value: '15,420', change: -2.1, changeLabel: 'vs last month', color: 'cyan', link: '/dashboard/ump/users' },
]

export const claimsTrendData: ChartDataPoint[] = [
  { name: 'Jan', claims: 3200, amount: 8.2 },
  { name: 'Feb', claims: 3800, amount: 9.5 },
  { name: 'Mar', claims: 4100, amount: 10.1 },
  { name: 'Apr', claims: 3900, amount: 9.8 },
  { name: 'May', claims: 4500, amount: 11.4 },
  { name: 'Jun', claims: 4800, amount: 12.2 },
  { name: 'Jul', claims: 5200, amount: 13.5 },
  { name: 'Aug', claims: 4876, amount: 12.8 },
]

export const stateComparisonData: ChartDataPoint[] = [
  { name: 'Madhya Pradesh', claims: 33500, beneficiaries: 980000, hospitals: 2100 },
  { name: 'Maharashtra', claims: 15256, beneficiaries: 265320, hospitals: 1148 },
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

// ─── BIS Card Printing ─────────────────────────────────────────────────────

export const bisKPIs: KPI[] = [
  { label: 'Total Cards', value: '9,82,450', change: 3.7, color: 'blue' },
  { label: 'Printed', value: '8,45,200', change: 4.1, color: 'green' },
  { label: 'Pending Print', value: '1,37,250', change: -1.2, color: 'orange' },
  { label: 'Delivered', value: '8,75,000', change: 5.8, color: 'emerald' },
]

export const bisStatusData: ChartDataPoint[] = [
  { name: 'Printed', value: 845200 },
  { name: 'Generated', value: 105000 },
  { name: 'Approved', value: 22000 },
  { name: 'Pending', value: 10250 },
]

export const bisDistrictData: ChartDataPoint[] = [
  { name: 'Bhopal', printed: 125000, pending: 8500 },
  { name: 'Indore', printed: 142000, pending: 12000 },
  { name: 'Jabalpur', printed: 98000, pending: 6200 },
  { name: 'Gwalior', printed: 87000, pending: 5800 },
  { name: 'Ujjain', printed: 76000, pending: 4500 },
  { name: 'Sagar', printed: 65000, pending: 3800 },
]

export const bisTableData = [
  { card_no: 'ABHA-MP-001234', state: 'Madhya Pradesh', district: 'Bhopal', status: 'Delivered', enroll_date: '2025-06-15', print_date: '2025-06-20' },
  { card_no: 'ABHA-MP-001235', state: 'Madhya Pradesh', district: 'Indore', status: 'Printed', enroll_date: '2025-06-18', print_date: '2025-06-22' },
  { card_no: 'ABHA-MP-001236', state: 'Madhya Pradesh', district: 'Jabalpur', status: 'Approved', enroll_date: '2025-07-01', print_date: '-' },
  { card_no: 'ABHA-MP-001237', state: 'Madhya Pradesh', district: 'Gwalior', status: 'Delivered', enroll_date: '2025-05-20', print_date: '2025-05-28' },
  { card_no: 'ABHA-MP-001238', state: 'Madhya Pradesh', district: 'Ujjain', status: 'Pending', enroll_date: '2025-07-10', print_date: '-' },
  { card_no: 'ABHA-MP-001239', state: 'Madhya Pradesh', district: 'Sagar', status: 'Printed', enroll_date: '2025-06-25', print_date: '2025-07-02' },
]

// ─── Maharashtra Claims ────────────────────────────────────────────────────

export const mhKPIs: KPI[] = [
  { label: 'Total Claims', value: '15,256', change: 6.2, color: 'blue' },
  { label: 'Amount Paid', value: '₹45.2 Cr', change: 9.8, color: 'green' },
  { label: 'Pending Claims', value: '2,140', change: -3.5, color: 'orange' },
  { label: 'Avg Claim Amount', value: '₹29,640', change: 2.1, color: 'purple' },
]

export const mhClaimsByStatus: ChartDataPoint[] = [
  { name: 'Paid', value: 10200 },
  { name: 'Approved', value: 2916 },
  { name: 'Pending', value: 2140 },
  { name: 'Rejected', value: 1000 },
]

export const mhClaimsByDistrict: ChartDataPoint[] = [
  { name: 'Mumbai', claims: 4200, amount: 14.2 },
  { name: 'Pune', claims: 3100, amount: 9.8 },
  { name: 'Nagpur', claims: 2400, amount: 7.1 },
  { name: 'Nashik', claims: 1800, amount: 5.4 },
  { name: 'Thane', claims: 1656, amount: 4.9 },
  { name: 'Others', claims: 2100, amount: 3.8 },
]

export const mhTableData = [
  { case_id: 'MH-2025-00142', patient: 'Rajesh Kumar', hospital: 'KEM Hospital Mumbai', status: 'Paid', amount: '₹1,25,000', admission: '2025-06-10' },
  { case_id: 'MH-2025-00143', patient: 'Priya Sharma', hospital: 'Sassoon Hospital Pune', status: 'Approved', amount: '₹85,400', admission: '2025-06-15' },
  { case_id: 'MH-2025-00144', patient: 'Amit Patil', hospital: 'GMCH Nagpur', status: 'Pending', amount: '₹2,10,000', admission: '2025-07-01' },
  { case_id: 'MH-2025-00145', patient: 'Sunita Desai', hospital: 'Civil Hospital Nashik', status: 'Paid', amount: '₹67,800', admission: '2025-05-28' },
  { case_id: 'MH-2025-00146', patient: 'Vikram Joshi', hospital: 'Jupiter Hospital Thane', status: 'Rejected', amount: '₹45,000', admission: '2025-06-20' },
]

// ─── MP Claims & Payments ──────────────────────────────────────────────────

export const mpClaimsKPIs: KPI[] = [
  { label: 'Total Claims', value: '33,500', change: 4.8, color: 'blue' },
  { label: 'Amount Paid', value: '₹80.2 Cr', change: 11.2, color: 'green' },
  { label: 'Preauth Approved', value: '28,400', change: 3.5, color: 'emerald' },
  { label: 'Portability Claims', value: '1,240', change: 15.6, color: 'purple' },
]

export const mpClaimsMonthly: ChartDataPoint[] = [
  { name: 'Jan', paid: 2200, pending: 450 },
  { name: 'Feb', paid: 2500, pending: 380 },
  { name: 'Mar', paid: 2800, pending: 420 },
  { name: 'Apr', paid: 2650, pending: 390 },
  { name: 'May', paid: 3100, pending: 350 },
  { name: 'Jun', paid: 3400, pending: 310 },
  { name: 'Jul', paid: 3600, pending: 280 },
  { name: 'Aug', paid: 3250, pending: 290 },
]

export const mpPaymentData: ChartDataPoint[] = [
  { name: 'Hospital Payment', value: 520000000 },
  { name: 'Beneficiary Refund', value: 45000000 },
  { name: 'TMS Recovery', value: 12000000 },
  { name: 'Portability', value: 25000000 },
]

export const mpClaimsTableData = [
  { case_id: 'MP-2025-08921', patient: 'Ram Singh', hospital: 'CH Indore', procedure: 'Knee Replacement', status: 'Paid', amount: '₹1,85,000' },
  { case_id: 'MP-2025-08922', patient: 'Geeta Bai', hospital: 'MY Hospital Jabalpur', procedure: 'Cataract Surgery', status: 'Approved', amount: '₹28,000' },
  { case_id: 'MP-2025-08923', patient: 'Mohan Lal', hospital: 'GMC Bhopal', procedure: 'Hernia Repair', status: 'Pending', amount: '₹45,000' },
  { case_id: 'MP-2025-08924', patient: 'Kamla Devi', hospital: 'District Hospital Gwalior', procedure: 'C-Section', status: 'Paid', amount: '₹32,000' },
  { case_id: 'MP-2025-08925', patient: 'Suresh Yadav', hospital: 'Civil Hospital Ujjain', procedure: 'Angioplasty', status: 'Under Review', amount: '₹2,50,000' },
]

// ─── MP Beneficiaries ──────────────────────────────────────────────────────

export const mpBeneficiaryKPIs: KPI[] = [
  { label: 'Total Beneficiaries', value: '9,80,000', change: 7.5, color: 'blue' },
  { label: 'eKYC Completed', value: '8,45,200', change: 9.2, color: 'green' },
  { label: 'Disabled Beneficiaries', value: '42,500', change: 2.1, color: 'orange' },
  { label: 'New Enrollments (MTD)', value: '18,450', change: 12.4, color: 'purple' },
]

export const mpBeneficiaryGender: ChartDataPoint[] = [
  { name: 'Male', value: 512000 },
  { name: 'Female', value: 458000 },
  { name: 'Other', value: 10000 },
]

export const mpBeneficiaryUrbanRural: ChartDataPoint[] = [
  { name: 'Rural', value: 720000 },
  { name: 'Urban', value: 260000 },
]

export const mpBeneficiaryTableData = [
  { ben_id: 'BEN-MP-452100', name: 'Ramesh Patel', district: 'Indore', ekyc: 'Completed', gender: 'Male', age: 45 },
  { ben_id: 'BEN-MP-452101', name: 'Savitri Devi', district: 'Bhopal', ekyc: 'Completed', gender: 'Female', age: 38 },
  { ben_id: 'BEN-MP-452102', name: 'Arjun Meena', district: 'Jabalpur', ekyc: 'Pending', gender: 'Male', age: 52 },
  { ben_id: 'BEN-MP-452103', name: 'Lakshmi Bai', district: 'Gwalior', ekyc: 'Completed', gender: 'Female', age: 61 },
  { ben_id: 'BEN-MP-452104', name: 'Vijay Kumar', district: 'Ujjain', ekyc: 'Completed', gender: 'Male', age: 29 },
]

// ─── MP Hospitals ──────────────────────────────────────────────────────────

export const mpHospitalKPIs: KPI[] = [
  { label: 'Total Hospitals', value: '2,100', change: 1.8, color: 'blue' },
  { label: 'NABH Certified', value: '485', change: 5.2, color: 'green' },
  { label: 'De-empanelled', value: '32', change: -8.5, color: 'red' },
  { label: 'HEM Mapped', value: '1,850', change: 2.4, color: 'purple' },
]

export const mpHospitalTypeData: ChartDataPoint[] = [
  { name: 'Government', value: 980 },
  { name: 'Private', value: 820 },
  { name: 'Trust', value: 210 },
  { name: 'Corporate', value: 90 },
]

export const mpHospitalDistrictData: ChartDataPoint[] = [
  { name: 'Bhopal', hospitals: 185, certified: 42 },
  { name: 'Indore', hospitals: 210, certified: 55 },
  { name: 'Jabalpur', hospitals: 165, certified: 38 },
  { name: 'Gwalior', hospitals: 140, certified: 30 },
  { name: 'Ujjain', hospitals: 120, certified: 28 },
]

export const mpHospitalTableData = [
  { code: 'HOS-MP-1201', name: 'MY Hospital Jabalpur', type: 'Government', district: 'Jabalpur', nabH: 'Yes', status: 'Active' },
  { code: 'HOS-MP-1202', name: 'CH Indore', type: 'Government', district: 'Indore', nabH: 'Yes', status: 'Active' },
  { code: 'HOS-MP-1203', name: 'Apollo Hospital Bhopal', type: 'Private', district: 'Bhopal', nabH: 'Yes', status: 'Active' },
  { code: 'HOS-MP-1204', name: 'District Hospital Gwalior', type: 'Government', district: 'Gwalior', nabH: 'No', status: 'Active' },
  { code: 'HOS-MP-1205', name: 'City Hospital Ujjain', type: 'Private', district: 'Ujjain', nabH: 'No', status: 'De-empanelled' },
]

// ─── MP Patients & Treatment ─────────────────────────────────────────────────

export const mpPatientKPIs: KPI[] = [
  { label: 'Total Patients', value: '1,25,400', change: 6.8, color: 'blue' },
  { label: 'MORTH Patients', value: '8,450', change: 4.2, color: 'green' },
  { label: 'Treatments Done', value: '98,200', change: 5.5, color: 'emerald' },
  { label: 'Avg Treatment Cost', value: '₹42,500', change: 1.8, color: 'purple' },
]

export const mpTreatmentData: ChartDataPoint[] = [
  { name: 'Cardiology', patients: 18500 },
  { name: 'Orthopedics', patients: 15200 },
  { name: 'Ophthalmology', patients: 22100 },
  { name: 'General Surgery', patients: 16800 },
  { name: 'Obstetrics', patients: 12400 },
  { name: 'Others', patients: 40400 },
]

export const mpPatientTableData = [
  { patient_id: 'PAT-MP-78201', name: 'Anil Verma', treatment: 'Knee Replacement', hospital: 'CH Indore', status: 'Discharged', cost: '₹1,85,000' },
  { patient_id: 'PAT-MP-78202', name: 'Meena Kumari', treatment: 'Cataract Surgery', hospital: 'MY Hospital', status: 'Discharged', cost: '₹28,000' },
  { patient_id: 'PAT-MP-78203', name: 'Dinesh Rao', treatment: 'Angioplasty', hospital: 'Apollo Bhopal', status: 'Admitted', cost: '₹2,50,000' },
  { patient_id: 'PAT-MP-78204', name: 'Pooja Sharma', treatment: 'C-Section', hospital: 'GMC Gwalior', status: 'Discharged', cost: '₹32,000' },
  { patient_id: 'PAT-MP-78205', name: 'Harish Malviya', treatment: 'Hernia Repair', hospital: 'Civil Hospital', status: 'Under Treatment', cost: '₹45,000' },
]

// ─── MP Fraud & Audit ──────────────────────────────────────────────────────

export const mpFraudKPIs: KPI[] = [
  { label: 'Suspicious Cases', value: '342', change: -12.5, color: 'red' },
  { label: 'Under Investigation', value: '128', change: 5.2, color: 'orange' },
  { label: 'Confirmed Fraud', value: '45', change: -8.1, color: 'red' },
  { label: 'Amount Recovered', value: '₹2.8 Cr', change: 18.4, color: 'green' },
]

export const mpFraudTrend: ChartDataPoint[] = [
  { name: 'Jan', suspicious: 42, confirmed: 5 },
  { name: 'Feb', suspicious: 38, confirmed: 4 },
  { name: 'Mar', suspicious: 55, confirmed: 8 },
  { name: 'Apr', suspicious: 48, confirmed: 6 },
  { name: 'May', suspicious: 35, confirmed: 3 },
  { name: 'Jun', suspicious: 52, confirmed: 7 },
  { name: 'Jul', suspicious: 40, confirmed: 5 },
  { name: 'Aug', suspicious: 32, confirmed: 7 },
]

export const mpFraudTableData = [
  { case_id: 'FRD-2025-001', hospital: 'XYZ Hospital Indore', type: 'Duplicate Claim', status: 'Under Investigation', amount: '₹4,50,000' },
  { case_id: 'FRD-2025-002', hospital: 'ABC Clinic Bhopal', type: 'Fake Documents', status: 'Confirmed', amount: '₹2,80,000' },
  { case_id: 'FRD-2025-003', hospital: 'DEF Medical Gwalior', type: 'Overbilling', status: 'Under Investigation', amount: '₹1,20,000' },
  { case_id: 'FRD-2025-004', hospital: 'GHI Hospital Jabalpur', type: 'Ghost Patient', status: 'Confirmed', amount: '₹6,50,000' },
  { case_id: 'FRD-2025-005', hospital: 'JKL Clinic Ujjain', type: 'Procedure Mismatch', status: 'Cleared', amount: '₹85,000' },
]

// ─── MP Users & Workflow ───────────────────────────────────────────────────

export const mpUsersKPIs: KPI[] = [
  { label: 'Workflow Users', value: '4,250', change: 3.2, color: 'blue' },
  { label: 'Active Today', value: '1,820', change: 8.5, color: 'green' },
  { label: 'Transactions (MTD)', value: '45,600', change: 6.1, color: 'purple' },
  { label: 'Avg Processing Time', value: '2.4 hrs', change: -15.2, color: 'emerald' },
]

export const mpWorkflowStatus: ChartDataPoint[] = [
  { name: 'Completed', value: 38500 },
  { name: 'In Progress', value: 4200 },
  { name: 'Pending Approval', value: 2100 },
  { name: 'Rejected', value: 800 },
]

export const mpUsersTableData = [
  { user_id: 'USR-001', name: 'Dr. Rajesh Kumar', role: 'Medical Officer', department: 'Claims', status: 'Active', last_login: '2025-08-13' },
  { user_id: 'USR-002', name: 'Priya Sharma', role: 'Data Entry Operator', department: 'BIS', status: 'Active', last_login: '2025-08-13' },
  { user_id: 'USR-003', name: 'Amit Singh', role: 'District Coordinator', department: 'Empanelment', status: 'Active', last_login: '2025-08-12' },
  { user_id: 'USR-004', name: 'Sunita Patel', role: 'Audit Officer', department: 'Fraud', status: 'Active', last_login: '2025-08-13' },
  { user_id: 'USR-005', name: 'Vikram Joshi', role: 'State Admin', department: 'Admin', status: 'Inactive', last_login: '2025-08-01' },
]

// ─── MP LMS Training ───────────────────────────────────────────────────────

export const mpLmsKPIs: KPI[] = [
  { label: 'Total Enrolled', value: '8,450', change: 12.5, color: 'blue' },
  { label: 'Completed', value: '6,200', change: 8.8, color: 'green' },
  { label: 'In Progress', value: '1,850', change: 15.2, color: 'orange' },
  { label: 'Completion Rate', value: '73.4%', change: 2.1, color: 'emerald' },
]

export const mpLmsCourseData: ChartDataPoint[] = [
  { name: 'Claims Processing', enrolled: 3200, completed: 2450 },
  { name: 'eKYC Training', enrolled: 2800, completed: 2100 },
  { name: 'Hospital Empanelment', enrolled: 1500, completed: 980 },
  { name: 'Fraud Detection', enrolled: 950, completed: 670 },
]

export const mpLmsTableData = [
  { user: 'Rajesh Kumar', course: 'Claims Processing', progress: '100%', status: 'Completed', completed_on: '2025-07-15' },
  { user: 'Priya Sharma', course: 'eKYC Training', progress: '85%', status: 'In Progress', completed_on: '-' },
  { user: 'Amit Singh', course: 'Hospital Empanelment', progress: '100%', status: 'Completed', completed_on: '2025-07-20' },
  { user: 'Sunita Patel', course: 'Fraud Detection', progress: '60%', status: 'In Progress', completed_on: '-' },
  { user: 'Vikram Joshi', course: 'Claims Processing', progress: '100%', status: 'Completed', completed_on: '2025-06-28' },
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
  { user_id: 'UMP-10002', name: 'Dr. Mehta', role: 'Medical Officer', state: 'Maharashtra', status: 'Active', created: '2024-03-20' },
  { user_id: 'UMP-10003', name: 'Data Operator 1', role: 'Data Entry', state: 'Madhya Pradesh', status: 'Active', created: '2024-06-10' },
  { user_id: 'UMP-10004', name: 'District Coordinator', role: 'District Admin', state: 'Madhya Pradesh', status: 'Active', created: '2024-08-05' },
  { user_id: 'UMP-10005', name: 'Hospital Admin', role: 'Hospital User', state: 'Maharashtra', status: 'Inactive', created: '2025-01-12' },
]
