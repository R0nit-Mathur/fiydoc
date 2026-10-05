export interface IndianCouncilInfo {
  code: string;
  name: string;
  state: string;
}

export const INDIAN_MEDICAL_COUNCILS: IndianCouncilInfo[] = [
  { code: 'NMC', name: 'National Medical Commission', state: 'All India' },
  { code: 'MMC', name: 'Maharashtra Medical Council', state: 'Maharashtra' },
  { code: 'DMC', name: 'Delhi Medical Council', state: 'Delhi' },
  { code: 'KMC', name: 'Karnataka Medical Council', state: 'Karnataka' },
  { code: 'TNMC', name: 'Tamil Nadu Medical Council', state: 'Tamil Nadu' },
  { code: 'UPMC', name: 'Uttar Pradesh Medical Council', state: 'Uttar Pradesh' },
  { code: 'WBMC', name: 'West Bengal Medical Council', state: 'West Bengal' },
  { code: 'GMC', name: 'Gujarat Medical Council', state: 'Gujarat' },
  { code: 'APMC', name: 'Andhra Pradesh Medical Council', state: 'Andhra Pradesh' },
  { code: 'TSMC', name: 'Telangana State Medical Council', state: 'Telangana' },
  { code: 'RMC', name: 'Rajasthan Medical Council', state: 'Rajasthan' },
  { code: 'TCMC', name: 'Travancore Cochin Medical Council', state: 'Kerala' },
  { code: 'MPMC', name: 'Madhya Pradesh Medical Council', state: 'Madhya Pradesh' },
  { code: 'PMC', name: 'Punjab Medical Council', state: 'Punjab' },
  { code: 'BMC', name: 'Bihar Medical Council', state: 'Bihar' },
  { code: 'HMC', name: 'Haryana State Medical Council', state: 'Haryana' },
  { code: 'OMC', name: 'Odisha Medical Council', state: 'Odisha' },
  { code: 'JKMC', name: 'Jammu & Kashmir Medical Council', state: 'Jammu & Kashmir' },
  { code: 'AMC', name: 'Assam Medical Council', state: 'Assam' },
  { code: 'UKMC', name: 'Uttarakhand Medical Council', state: 'Uttarakhand' },
  { code: 'HPMC', name: 'Himachal Pradesh Medical Council', state: 'Himachal Pradesh' },
];

export const doctorVerificationService = {
  validateLicense(licenseNumber: string, councilCode: string = 'NMC') {
    const cleanNum = licenseNumber ? licenseNumber.trim().toUpperCase() : '';
    const council = INDIAN_MEDICAL_COUNCILS.find((c) => c.code === councilCode) || INDIAN_MEDICAL_COUNCILS[0];

    const isValidFormat = cleanNum.length >= 4 && /^[A-Z0-9\/-]{4,18}$/.test(cleanNum);

    return {
      isValid: isValidFormat,
      councilName: council.name,
      state: council.state,
      status: isValidFormat ? 'DOCUMENTS_SUBMITTED' : 'FORMAT_INVALID',
      statusText: isValidFormat ? 'Format checked • Pending regulator review' : 'Registration format needs review',
      badgeText: isValidFormat ? `${council.code} Registration Pending Review` : 'Registration Not Verified',
    };
  },
};
