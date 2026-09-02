export interface DivisionData {
  division: string
  oic: string
  districts: string[]
}

export const MP_DIVISIONS: DivisionData[] = [
  {
    division: 'Bhopal',
    oic: 'Dr. Ravindra Gupta',
    districts: ['Bhopal'],
  },
  {
    division: 'Narmadapuram',
    oic: 'Dr. Ashwin Ingle',
    districts: ['Betul', 'Harda', 'Hoshangabad', 'Raisen', 'Rajgarh', 'Sehore', 'Vidisha'],
  },
  {
    division: 'Gwalior',
    oic: 'Dr. Naveen Diwan',
    districts: ['Gwalior', 'Ashoknagar', 'Bhind', 'Datia', 'Guna', 'Morena', 'Sheopur', 'Shivpuri'],
  },
  {
    division: 'Indore',
    oic: 'Dr. Sachin Kumar Malaiya',
    districts: ['Indore', 'Alirajpur', 'Barwani', 'Burhanpur', 'Dhar', 'Jhabua', 'Khandwa', 'Khargone'],
  },
  {
    division: 'Jabalpur',
    oic: 'Dr. Sanjay Sharma',
    districts: ['Jabalpur', 'Balaghat', 'Chhindwara', 'Dindori', 'Katni', 'Mandla', 'Narsinghpur', 'Seoni', 'Pandhurna'],
  },
  {
    division: 'Rewa',
    oic: 'Dr. Rahul Kumar Jain',
    districts: ['Rewa', 'Anuppur', 'Satna', 'Shahdol', 'Sidhi', 'Singrauli', 'Umaria', 'Maihar', 'Mauganj'],
  },
  {
    division: 'Sagar',
    oic: 'Dr. Rahul Kumar Jain',
    districts: ['Sagar', 'Chhatarpur', 'Damoh', 'Panna', 'Tikamgarh', 'Niwari'],
  },
  {
    division: 'Ujjain',
    oic: 'Dr. Rakesh Thakur',
    districts: ['Ujjain', 'Agarmalwa', 'Dewas', 'Mandsaur', 'Neemuch', 'Ratlam', 'Shajapur'],
  },
]

export const DIVISION_OPTIONS = [
  { value: '', label: 'All Divisions' },
  ...MP_DIVISIONS.map((d) => ({ value: d.division, label: d.division })),
]

export function getDistrictsForDivision(divisionName?: string) {
  if (!divisionName) {
    const allDistricts = Array.from(
      new Set(MP_DIVISIONS.flatMap((d) => d.districts))
    ).sort()
    return [
      { value: '', label: 'All Districts' },
      ...allDistricts.map((d) => ({ value: d, label: d })),
    ]
  }

  const divObj = MP_DIVISIONS.find(
    (d) => d.division.toLowerCase() === divisionName.toLowerCase()
  )

  if (!divObj) {
    const allDistricts = Array.from(
      new Set(MP_DIVISIONS.flatMap((d) => d.districts))
    ).sort()
    return [
      { value: '', label: 'All Districts' },
      ...allDistricts.map((d) => ({ value: d, label: d })),
    ]
  }

  return [
    { value: '', label: 'All Districts' },
    ...divObj.districts.map((d) => ({ value: d, label: d })),
  ]
}

export function getDivisionForDistrict(districtName: string): string | undefined {
  if (!districtName) return undefined
  const divObj = MP_DIVISIONS.find((d) =>
    d.districts.some((dist) => dist.toLowerCase() === districtName.toLowerCase())
  )
  return divObj?.division
}

export const DISTRICT_OPTIONS = getDistrictsForDivision()

export const STATE_TYPE_OPTIONS = [
  { value: '', label: 'Both (MP + Portability)' },
  { value: 'MP', label: 'MP' },
  { value: 'Portability', label: 'Portability' },
]

/** True when the name matches a district in the MP Division / District filter lists. */
export function isMpDistrict(districtName?: string) {
  const raw = String(districtName ?? '').trim().toLowerCase()
  if (!raw) return false
  if (getDivisionForDistrict(raw)) return true
  const all = MP_DIVISIONS.flatMap((d) => d.districts)
  return all.some((d) => {
    const name = d.toLowerCase()
    if (raw.includes(name)) return true
    if (name.length >= 4 && name.includes(raw)) return true
    return false
  })
}

export function isMpDivisionName(divisionName?: string) {
  const raw = String(divisionName ?? '').trim().toLowerCase()
  if (!raw) return false
  return MP_DIVISIONS.some((d) => d.division.toLowerCase() === raw)
}

/** MP = in SHA division/district lists; Portability = everything else. */
export function deriveGeoStateType(row: Record<string, string | number>) {
  const district = String(
    row.district_name || row.dist_name || row.hosp_district_name || row.patient_district_name || ''
  )
  if (isMpDistrict(district)) return 'MP'
  const division = String(row.division_name || row.division || '')
  if (isMpDivisionName(division)) return 'MP'
  return 'Portability'
}

export const CLAIM_STATUS_OPTIONS = [
  { value: '', label: 'All Claim Status' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Under Review', label: 'Under Review' },
]

export const CARD_STATUS_OPTIONS = [
  { value: '', label: 'All Card Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Generated', label: 'Generated' },
  { value: 'Printed', label: 'Printed' },
  { value: 'Distributed', label: 'Distributed' },
  { value: 'Delivered', label: 'Delivered' },
]

export const USER_STATUS_OPTIONS = [
  { value: '', label: 'All User Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

export const HOSPITAL_STATUS_OPTIONS = [
  { value: '', label: 'All Hospital Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'De-empanelled', label: 'De-empanelled' },
]

export const PATIENT_STATUS_OPTIONS = [
  { value: '', label: 'All Patient Status' },
  { value: 'Admitted', label: 'Admitted' },
  { value: 'Discharged', label: 'Discharged' },
]

export const INVESTIGATION_STATUS_OPTIONS = [
  { value: '', label: 'All Investigation Status' },
  { value: 'Under Investigation', label: 'Under Investigation' },
  { value: 'Confirmed Fraud', label: 'Confirmed Fraud' },
  { value: 'Cleared', label: 'Cleared' },
]

/** FRS §7 case disposition values — maps to investigation_status column */
export const SAFU_CASE_STATUS_OPTIONS = [
  { value: '', label: 'All Case Status' },
  { value: 'Under Investigation', label: 'Suspicious / Under Investigation' },
  { value: 'Under Process', label: 'Under Process' },
  { value: 'Fraud Detected', label: 'Fraud Detected' },
  { value: 'Non-Fraud', label: 'Non-Fraud' },
  { value: 'Query I Pending', label: 'Query I Pending (Hospital)' },
  { value: 'Query II Pending', label: 'Query II Pending (CPD)' },
  { value: 'Query III Pending', label: 'Query III Pending (SAFU Doctor)' },
]

export const TRIGGER_TYPE_OPTIONS = [
  { value: '', label: 'All Trigger Types' },
  { value: 'DUP-CLAIM', label: 'DUP-CLAIM' },
  { value: 'DEVICE-SHARE', label: 'DEVICE-SHARE' },
  { value: 'DOC-ANOMALY', label: 'DOC-ANOMALY' },
  { value: 'GEO-MISMATCH', label: 'GEO-MISMATCH' },
  { value: 'PKG-MISMATCH', label: 'PKG-MISMATCH' },
  { value: 'AMOUNT-SPIKE', label: 'AMOUNT-SPIKE' },
]

export const TRIGGER_CODE_OPTIONS = [
  { value: '', label: 'All Trigger Codes' },
  { value: 'DUP-CLAIM-01', label: 'DUP-CLAIM-01' },
  { value: 'DUP-CLAIM-05', label: 'DUP-CLAIM-05' },
  { value: 'DEV-SHARE-01', label: 'DEV-SHARE-01' },
  { value: 'DEV-SHARE-03', label: 'DEV-SHARE-03' },
  { value: 'DOC-FAKE-02', label: 'DOC-FAKE-02' },
  { value: 'DOC-FAKE-08', label: 'DOC-FAKE-08' },
  { value: 'GEO-MIS-01', label: 'GEO-MIS-01' },
  { value: 'GEO-MIS-03', label: 'GEO-MIS-03' },
  { value: 'PKG-MIS-02', label: 'PKG-MIS-02' },
  { value: 'PKG-MIS-07', label: 'PKG-MIS-07' },
  { value: 'AMT-SPIKE-01', label: 'AMT-SPIKE-01' },
  { value: 'AMT-SPIKE-04', label: 'AMT-SPIKE-04' },
]

export const APPLICATION_TYPE_OPTIONS = [
  { value: '', label: 'All Application Types' },
  { value: 'CLAIM', label: 'CLAIM' },
  { value: 'ENROLMENT', label: 'ENROLMENT' },
  { value: 'CARD', label: 'CARD' },
  { value: 'PREAUTH', label: 'PREAUTH' },
]

export const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entity Types' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'User', label: 'User' },
  { value: 'Beneficiary', label: 'Beneficiary' },
]

export const SAFU_DOCTOR_OPTIONS = [
  { value: '', label: 'All SAFU Doctors' },
  { value: 'Dr. Sunita Patel', label: 'Dr. Sunita Patel' },
  { value: 'Dr. Rajesh Kumar', label: 'Dr. Rajesh Kumar' },
  { value: 'Dr. Amit Singh', label: 'Dr. Amit Singh' },
  { value: 'Dr. Priya Sharma', label: 'Dr. Priya Sharma' },
  { value: 'Dr. Vikram Joshi', label: 'Dr. Vikram Joshi' },
]

export const SHA_AFO_OPTIONS = [
  { value: '', label: 'All SHA-AFO Officers' },
  { value: 'sha.reviewer01', label: 'sha.reviewer01' },
  { value: 'sha.reviewer02', label: 'sha.reviewer02' },
  { value: 'sha.reviewer03', label: 'sha.reviewer03' },
  { value: 'sha.reviewer04', label: 'sha.reviewer04' },
  { value: 'cpd.officer01', label: 'cpd.officer01' },
]

export const TRAINING_STATUS_OPTIONS = [
  { value: '', label: 'All Training Status' },
  { value: 'Completed', label: 'Completed' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Not Started', label: 'Not Started' },
]

export const ENROLLMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Enrollment Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Disabled', label: 'Disabled' },
]

export const GENDER_OPTIONS = [
  { value: '', label: 'All Gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

export const URBAN_RURAL_OPTIONS = [
  { value: '', label: 'All Areas' },
  { value: 'Urban', label: 'Urban' },
  { value: 'Rural', label: 'Rural' },
]

export const HOSPITAL_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Government', label: 'Government' },
  { value: 'Private', label: 'Private' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Corporate', label: 'Corporate' },
]

export const CASE_TYPE_OPTIONS = [
  { value: '', label: 'All Case Types' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Planned', label: 'Planned' },
  { value: 'Portability', label: 'Portability' },
]

export const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'State Admin', label: 'State Admin' },
  { value: 'Medical Officer', label: 'Medical Officer' },
  { value: 'Data Entry Operator', label: 'Data Entry Operator' },
  { value: 'District Coordinator', label: 'District Coordinator' },
  { value: 'Audit Officer', label: 'Audit Officer' },
  { value: 'Hospital User', label: 'Hospital User' },
]

export const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'Claims', label: 'Claims' },
  { value: 'BIS', label: 'BIS' },
  { value: 'Empanelment', label: 'Empanelment' },
  { value: 'Fraud', label: 'Fraud' },
  { value: 'Admin', label: 'Admin' },
]

export const EKYC_OPTIONS = [
  { value: '', label: 'All eKYC Status' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
]

export const FRAUD_TYPE_OPTIONS = [
  { value: '', label: 'All Fraud Types' },
  { value: 'Duplicate Claim', label: 'Duplicate Claim' },
  { value: 'Fake Documents', label: 'Fake Documents' },
  { value: 'Overbilling', label: 'Overbilling' },
  { value: 'Ghost Patient', label: 'Ghost Patient' },
  { value: 'Procedure Mismatch', label: 'Procedure Mismatch' },
]

export const COURSE_OPTIONS = [
  { value: '', label: 'All Courses' },
  { value: 'Claims Processing', label: 'Claims Processing' },
  { value: 'eKYC Training', label: 'eKYC Training' },
  { value: 'Hospital Empanelment', label: 'Hospital Empanelment' },
  { value: 'Fraud Detection', label: 'Fraud Detection' },
]

export const NABH_OPTIONS = [
  { value: '', label: 'All NABH' },
  { value: 'Yes', label: 'NABH Certified' },
  { value: 'No', label: 'Not Certified' },
]
