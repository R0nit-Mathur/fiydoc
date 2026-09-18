export interface IndianCouncilInfo {
  code: string;
  name: string;
  state: string;
  sampleFormat: string;
}

export const INDIAN_MEDICAL_COUNCILS: IndianCouncilInfo[] = [
  { code: 'NMC', name: 'National Medical Commission (NMC / formerly MCI)', state: 'All India', sampleFormat: 'MCI-847291' },
  { code: 'MMC', name: 'Maharashtra Medical Council (MMC)', state: 'Maharashtra', sampleFormat: 'MMC/2018/04/1234' },
  { code: 'DMC', name: 'Delhi Medical Council (DMC)', state: 'Delhi', sampleFormat: 'DMC-84729' },
  { code: 'KMC', name: 'Karnataka Medical Council (KMC)', state: 'Karnataka', sampleFormat: 'KMC-54321' },
  { code: 'TNMC', name: 'Tamil Nadu Medical Council (TNMC)', state: 'Tamil Nadu', sampleFormat: 'TNMC-98765' },
  { code: 'UPMC', name: 'Uttar Pradesh Medical Council (UPMC)', state: 'Uttar Pradesh', sampleFormat: 'UPMC-34567' },
  { code: 'WBMC', name: 'West Bengal Medical Council (WBMC)', state: 'West Bengal', sampleFormat: 'WBMC-45678' },
  { code: 'GMC', name: 'Gujarat Medical Council (GMC)', state: 'Gujarat', sampleFormat: 'GMC-56789' },
  { code: 'APMC', name: 'Andhra Pradesh Medical Council (APMC)', state: 'Andhra Pradesh', sampleFormat: 'APMC-67890' },
  { code: 'TSMC', name: 'Telangana State Medical Council (TSMC)', state: 'Telangana', sampleFormat: 'TSMC-78901' },
  { code: 'RMC', name: 'Rajasthan Medical Council (RMC)', state: 'Rajasthan', sampleFormat: 'RMC-89012' },
  { code: 'TCMC', name: 'Travancore Cochin / Kerala Medical Council', state: 'Kerala', sampleFormat: 'KMC-65432' },
  { code: 'MPMC', name: 'Madhya Pradesh Medical Council (MPMC)', state: 'Madhya Pradesh', sampleFormat: 'MPMC-12345' },
  { code: 'PMC', name: 'Punjab Medical Council (PMC)', state: 'Punjab', sampleFormat: 'PMC-23456' },
  { code: 'BMC', name: 'Bihar Medical Council (BMC)', state: 'Bihar', sampleFormat: 'BMC-34567' },
  { code: 'HMC', name: 'Haryana State Medical Council', state: 'Haryana', sampleFormat: 'HMC-45678' },
  { code: 'OMC', name: 'Odisha Medical Council', state: 'Odisha', sampleFormat: 'OMC-56789' },
  { code: 'JKMC', name: 'Jammu & Kashmir Medical Council', state: 'Jammu & Kashmir', sampleFormat: 'JKMC-67890' },
  { code: 'AMC', name: 'Assam Medical Council', state: 'Assam', sampleFormat: 'AMC-78901' },
  { code: 'UKMC', name: 'Uttarakhand Medical Council', state: 'Uttarakhand', sampleFormat: 'UKMC-89012' },
  { code: 'HPMC', name: 'Himachal Pradesh Medical Council', state: 'Himachal Pradesh', sampleFormat: 'HPMC-90123' },
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
      sampleFormat: council.sampleFormat,
      status: isValidFormat ? 'DOCUMENTS_SUBMITTED' : 'FORMAT_INVALID',
      statusText: isValidFormat ? 'Format Validated • Pending Medical Council Registry Verification' : 'Invalid License Format',
      badgeText: isValidFormat ? `${council.code} Registration Submitted` : 'Unverified License',
    };
  },
};
