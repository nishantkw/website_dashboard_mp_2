export interface ConnectedColumn {
  key: string
  label: string
}

export interface ConnectedDataset {
  title: string
  subtitle: string
  columns: ConnectedColumn[]
  records: Record<string, string | number>[]
}

// 1. Total Beneficiaries Connected Data
export const beneficiariesConnectedData: ConnectedDataset = {
  title: 'Total Beneficiaries Dataset',
  subtitle: 'Connected records for enrolled beneficiaries under PM-JAY',
  columns: [
    { key: 'ben_id', label: 'Beneficiary ID' },
    { key: 'name', label: 'Member Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'age', label: 'Age' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'ekyc', label: 'eKYC Status' },
    { key: 'issue_date', label: 'Enrollment Date' },
  ],
  records: [
    { ben_id: 'BEN-MP-88201', name: 'Ramesh Patel', gender: 'Male', age: 45, district: 'Indore', state: 'Madhya Pradesh', ekyc: 'Completed', issue_date: '2025-01-12' },
    { ben_id: 'BEN-MP-88202', name: 'Savitri Devi', gender: 'Female', age: 38, district: 'Bhopal', state: 'Madhya Pradesh', ekyc: 'Completed', issue_date: '2025-01-15' },
    { ben_id: 'BEN-MH-88203', name: 'Arjun Shinde', gender: 'Male', age: 52, district: 'Mumbai', state: 'Maharashtra', ekyc: 'Completed', issue_date: '2025-02-01' },
    { ben_id: 'BEN-MP-88204', name: 'Lakshmi Bai', gender: 'Female', age: 61, district: 'Gwalior', state: 'Madhya Pradesh', ekyc: 'Completed', issue_date: '2025-02-10' },
    { ben_id: 'BEN-MH-88205', name: 'Vijay Patil', gender: 'Male', age: 29, district: 'Pune', state: 'Maharashtra', ekyc: 'Pending', issue_date: '2025-02-18' },
    { ben_id: 'BEN-MP-88206', name: 'Kamla Yadav', gender: 'Female', age: 49, district: 'Jabalpur', state: 'Madhya Pradesh', ekyc: 'Completed', issue_date: '2025-03-02' },
    { ben_id: 'BEN-MH-88207', name: 'Suresh Deshmukh', gender: 'Male', age: 57, district: 'Nagpur', state: 'Maharashtra', ekyc: 'Completed', issue_date: '2025-03-11' },
    { ben_id: 'BEN-MP-88208', name: 'Geeta Verma', gender: 'Female', age: 34, district: 'Ujjain', state: 'Madhya Pradesh', ekyc: 'Completed', issue_date: '2025-03-25' },
    { ben_id: 'BEN-MP-88209', name: 'Mohan Sharma', gender: 'Male', age: 64, district: 'Sagar', state: 'Madhya Pradesh', ekyc: 'Pending', issue_date: '2025-04-05' },
    { ben_id: 'BEN-MH-88210', name: 'Sunita Pawar', gender: 'Female', age: 41, district: 'Nashik', state: 'Maharashtra', ekyc: 'Completed', issue_date: '2025-04-14' },
  ],
}

// 2. Total Claims Connected Data
export const claimsConnectedData: ConnectedDataset = {
  title: 'Total Claims Dataset',
  subtitle: 'Connected records for pre-authorized and submitted treatment claims',
  columns: [
    { key: 'claim_id', label: 'Claim ID' },
    { key: 'patient_name', label: 'Patient Name' },
    { key: 'hospital_name', label: 'Hospital Name' },
    { key: 'procedure_name', label: 'Package / Procedure' },
    { key: 'state', label: 'State' },
    { key: 'amount', label: 'Claim Amount (₹)' },
    { key: 'status', label: 'Status' },
    { key: 'claim_date', label: 'Submission Date' },
  ],
  records: [
    { claim_id: 'CLM-MP-2025-01', patient_name: 'Ram Singh', hospital_name: 'CH Indore', procedure_name: 'Total Knee Replacement', state: 'Madhya Pradesh', amount: '₹1,85,000', status: 'Paid', claim_date: '2025-06-10' },
    { claim_id: 'CLM-MH-2025-02', patient_name: 'Priya Sharma', hospital_name: 'KEM Hospital Mumbai', procedure_name: 'Coronary Angioplasty', state: 'Maharashtra', amount: '₹2,10,000', status: 'Paid', claim_date: '2025-06-14' },
    { claim_id: 'CLM-MP-2025-03', patient_name: 'Geeta Bai', hospital_name: 'MY Hospital Jabalpur', procedure_name: 'Cataract Surgery', state: 'Madhya Pradesh', amount: '₹28,000', status: 'Approved', claim_date: '2025-06-18' },
    { claim_id: 'CLM-MH-2025-04', patient_name: 'Amit Patil', hospital_name: 'Sassoon Hospital Pune', procedure_name: 'Appendectomy', state: 'Maharashtra', amount: '₹45,000', status: 'Pending', claim_date: '2025-07-01' },
    { claim_id: 'CLM-MP-2025-05', patient_name: 'Mohan Lal', hospital_name: 'GMC Bhopal', procedure_name: 'Inguinal Hernia Repair', state: 'Madhya Pradesh', amount: '₹42,000', status: 'Approved', claim_date: '2025-07-05' },
    { claim_id: 'CLM-MP-2025-06', patient_name: 'Kamla Devi', hospital_name: 'District Hospital Gwalior', procedure_name: 'Caesarean Section', state: 'Madhya Pradesh', amount: '₹32,000', status: 'Paid', claim_date: '2025-07-12' },
    { claim_id: 'CLM-MH-2025-07', patient_name: 'Vikram Joshi', hospital_name: 'GMCH Nagpur', procedure_name: 'Dialysis Session', state: 'Maharashtra', amount: '₹15,000', status: 'Under Review', claim_date: '2025-07-20' },
    { claim_id: 'CLM-MP-2025-08', patient_name: 'Suresh Yadav', hospital_name: 'Civil Hospital Ujjain', procedure_name: 'Gallbladder Removal', state: 'Madhya Pradesh', amount: '₹55,000', status: 'Rejected', claim_date: '2025-07-25' },
  ],
}

// 3. Claims Paid Amount Connected Data
export const claimsPaidConnectedData: ConnectedDataset = {
  title: 'Claims Paid Amount Disbursements',
  subtitle: 'Connected financial disbursement and bank settlement records',
  columns: [
    { key: 'txn_id', label: 'Txn Ref ID' },
    { key: 'hospital_name', label: 'Hospital Beneficiary' },
    { key: 'state', label: 'State' },
    { key: 'paid_amount', label: 'Disbursed Amount (₹)' },
    { key: 'bank_ref', label: 'Bank UTR / Txn No' },
    { key: 'settlement_date', label: 'Settlement Date' },
    { key: 'status', label: 'Payment Status' },
  ],
  records: [
    { txn_id: 'TXN-2025-9901', hospital_name: 'MY Hospital Jabalpur', state: 'Madhya Pradesh', paid_amount: '₹45,20,000', bank_ref: 'UTR-SBIN0012458', settlement_date: '2025-08-01', status: 'Settled' },
    { txn_id: 'TXN-2025-9902', hospital_name: 'CH Indore', state: 'Madhya Pradesh', paid_amount: '₹62,80,000', bank_ref: 'UTR-SBIN0012459', settlement_date: '2025-08-02', status: 'Settled' },
    { txn_id: 'TXN-2025-9903', hospital_name: 'KEM Hospital Mumbai', state: 'Maharashtra', paid_amount: '₹88,40,000', bank_ref: 'UTR-HDFC0098123', settlement_date: '2025-08-04', status: 'Settled' },
    { txn_id: 'TXN-2025-9904', hospital_name: 'GMC Bhopal', state: 'Madhya Pradesh', paid_amount: '₹34,10,000', bank_ref: 'UTR-SBIN0012460', settlement_date: '2025-08-06', status: 'Settled' },
    { txn_id: 'TXN-2025-9905', hospital_name: 'Sassoon Hospital Pune', state: 'Maharashtra', paid_amount: '₹51,60,000', bank_ref: 'UTR-ICIC0004561', settlement_date: '2025-08-08', status: 'Settled' },
    { txn_id: 'TXN-2025-9906', hospital_name: 'District Hospital Gwalior', state: 'Madhya Pradesh', paid_amount: '₹22,90,000', bank_ref: 'UTR-SBIN0012461', settlement_date: '2025-08-10', status: 'Settled' },
  ],
}

// 4. Cards Printed Connected Data
export const cardsPrintedConnectedData: ConnectedDataset = {
  title: 'Cards Printed Lifecycle Data',
  subtitle: 'Connected printing batch, vendor, and distribution tracking',
  columns: [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'ben_name', label: 'Beneficiary Name' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'vendor', label: 'Printing Vendor' },
    { key: 'print_status', label: 'Print Status' },
    { key: 'dispatched_date', label: 'Dispatch Date' },
  ],
  records: [
    { batch_id: 'BATCH-MP-401', ben_name: 'Ramesh Patel', district: 'Indore', state: 'Madhya Pradesh', vendor: 'Manipal Technologies', print_status: 'Printed & Dispatched', dispatched_date: '2025-07-02' },
    { batch_id: 'BATCH-MP-402', ben_name: 'Savitri Devi', district: 'Bhopal', state: 'Madhya Pradesh', vendor: 'Manipal Technologies', print_status: 'Printed & Dispatched', dispatched_date: '2025-07-05' },
    { batch_id: 'BATCH-MH-403', ben_name: 'Arjun Shinde', district: 'Mumbai', state: 'Maharashtra', vendor: 'Security Printing Press', print_status: 'Printed & Dispatched', dispatched_date: '2025-07-08' },
    { batch_id: 'BATCH-MP-404', ben_name: 'Lakshmi Bai', district: 'Gwalior', state: 'Madhya Pradesh', vendor: 'Manipal Technologies', print_status: 'In Print Queue', dispatched_date: '-' },
    { batch_id: 'BATCH-MH-405', ben_name: 'Vijay Patil', district: 'Pune', state: 'Maharashtra', vendor: 'Security Printing Press', print_status: 'Printed & Dispatched', dispatched_date: '2025-07-15' },
    { batch_id: 'BATCH-MP-406', ben_name: 'Geeta Verma', district: 'Ujjain', state: 'Madhya Pradesh', vendor: 'Manipal Technologies', print_status: 'Printed & Dispatched', dispatched_date: '2025-07-20' },
  ],
}

// 5. Hospitals Empanelled Connected Data
export const hospitalsConnectedData: ConnectedDataset = {
  title: 'Hospitals Empanelled Catalog',
  subtitle: 'Connected empanelment records, NABH certification, and bed capacity',
  columns: [
    { key: 'code', label: 'Hospital Code' },
    { key: 'name', label: 'Hospital Name' },
    { key: 'type', label: 'Category Type' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'nabh', label: 'NABH Certified' },
    { key: 'beds', label: 'Bed Capacity' },
    { key: 'empanelled_date', label: 'Empanelled Date' },
    { key: 'status', label: 'Status' },
  ],
  records: [
    { code: 'HOS-MP-1201', name: 'MY Hospital Jabalpur', type: 'Government', district: 'Jabalpur', state: 'Madhya Pradesh', nabh: 'Yes', beds: 850, empanelled_date: '2020-04-15', status: 'Active' },
    { code: 'HOS-MP-1202', name: 'CH Indore', type: 'Government', district: 'Indore', state: 'Madhya Pradesh', nabh: 'Yes', beds: 1200, empanelled_date: '2020-05-20', status: 'Active' },
    { code: 'HOS-MP-1203', name: 'Apollo Hospital Bhopal', type: 'Private', district: 'Bhopal', state: 'Madhya Pradesh', nabh: 'Yes', beds: 350, empanelled_date: '2021-02-10', status: 'Active' },
    { code: 'HOS-MH-1204', name: 'KEM Hospital Mumbai', type: 'Government', district: 'Mumbai', state: 'Maharashtra', nabh: 'Yes', beds: 1800, empanelled_date: '2019-11-01', status: 'Active' },
    { code: 'HOS-MH-1205', name: 'Sassoon Hospital Pune', type: 'Government', district: 'Pune', state: 'Maharashtra', nabh: 'Yes', beds: 1100, empanelled_date: '2020-01-15', status: 'Active' },
    { code: 'HOS-MP-1206', name: 'District Hospital Gwalior', type: 'Government', district: 'Gwalior', state: 'Madhya Pradesh', nabh: 'No', beds: 450, empanelled_date: '2020-08-12', status: 'Active' },
    { code: 'HOS-MP-1207', name: 'City Hospital Ujjain', type: 'Private', district: 'Ujjain', state: 'Madhya Pradesh', nabh: 'No', beds: 120, empanelled_date: '2022-03-30', status: 'De-empanelled' },
  ],
}

// 6. Active Users (UMP) Connected Data
export const activeUsersConnectedData: ConnectedDataset = {
  title: 'Active Administrative Users (UMP)',
  subtitle: 'Connected user master records, assigned roles, and active states',
  columns: [
    { key: 'user_id', label: 'User ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'role', label: 'Assigned Role' },
    { key: 'department', label: 'Department / Organization' },
    { key: 'state', label: 'State Jurisdiction' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'status', label: 'Account Status' },
  ],
  records: [
    { user_id: 'UMP-10001', name: 'Super Administrator', role: 'Super Administrator', department: 'State Health Agency (SHA)', state: 'Madhya Pradesh', last_login: '2025-08-14 11:45', status: 'Active' },
    { user_id: 'UMP-10002', name: 'Admin User', role: 'State Administrator', department: 'State Health Agency', state: 'Madhya Pradesh', last_login: '2025-08-14 10:30', status: 'Active' },
    { user_id: 'UMP-10003', name: 'Priya Sharma', role: 'BIS Operator', department: 'BIS - Card Printing', state: 'Madhya Pradesh', last_login: '2025-08-14 09:15', status: 'Active' },
    { user_id: 'UMP-10004', name: 'Amit Patil', role: 'Maharashtra Analyst', department: 'Maharashtra Data Mart', state: 'Maharashtra', last_login: '2025-08-13 18:20', status: 'Active' },
    { user_id: 'UMP-10005', name: 'Rajesh Kumar', role: 'Madhya Pradesh Analyst', department: 'Madhya Pradesh Data Mart', state: 'Madhya Pradesh', last_login: '2025-08-14 08:45', status: 'Active' },
    { user_id: 'UMP-10006', name: 'Sunita Desai', role: 'UMP Administrator', department: 'User Management Platform', state: 'Madhya Pradesh', last_login: '2025-08-01 14:10', status: 'Inactive' },
  ],
}

// Helper mapping function to get connected dataset based on KPI card label or Chart Title
export function getConnectedDataset(label: string, subtitle?: string): ConnectedDataset {
  const norm = String(label || '').toLowerCase().trim()
  const subNorm = String(subtitle || '').toLowerCase().trim()

  if (norm.includes('beneficiar')) return beneficiariesConnectedData
  if (norm.includes('total claim') || norm.includes('claims trend')) return claimsConnectedData
  if (norm.includes('paid amount') || norm.includes('amount paid')) return claimsPaidConnectedData
  if (norm.includes('card') && (norm.includes('print') || subNorm.includes('funnel'))) return cardsPrintedConnectedData
  if (norm.includes('hospital') || norm.includes('empanelled')) return hospitalsConnectedData
  if (norm.includes('user') || norm.includes('ump') || subNorm.includes('ump')) return activeUsersConnectedData

  // Fallback default
  return claimsConnectedData
}
