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
      badgeText: `${council.code} VERIFIED PRACTITIONER`,
      certificateId: `NMC-IN-${cleanNum.replace(/[^A-Z0-9]/g, '')}`,
    };
  },
};
