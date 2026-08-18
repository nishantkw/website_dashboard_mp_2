export const SCHEMA_OPTIONS = [
  { value: '', label: 'All Schemas' },
  { value: 'bis_raw', label: 'bis_raw — BIS Card Printing' },
  { value: 'dmart_mp', label: 'dmart_mp — Madhya Pradesh' },
  { value: 'ump_raw', label: 'ump_raw — User Management' },
]

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

export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Printed', label: 'Printed' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'In Progress', label: 'In Progress' },
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
