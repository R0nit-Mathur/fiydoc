export interface MedicineItem {
  id: string;
  name: string;
  generic: string;
  category: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler' | 'Drops';
  defaultDosage: string;
  defaultFrequency: string;
  defaultDuration: string;
  instructions: string;
}

export interface DiagnosticTestItem {
  id: string;
  name: string;
  category: string;
  turnaroundTime: string;
  fastingRequired: boolean;
  instructions: string;
}

export const MEDICINES_DIRECTORY: MedicineItem[] = [
  {
    id: 'med_1',
    name: 'Dolo 650',
    generic: 'Paracetamol IP 650mg',
    category: 'Analgesics & Fever',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'TDS (Thrice Daily after meals)',
    defaultDuration: '3-5 Days',
    instructions: 'Take with warm water. Maximum 4 doses in 24 hours.',
  },
  {
    id: 'med_2',
    name: 'Augmentin 625 Duo',
    generic: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'BD (Twice Daily after food)',
    defaultDuration: '5 Days',
    instructions: 'Complete full course. Do not stop midway.',
  },
  {
    id: 'med_3',
    name: 'Pan 40',
    generic: 'Pantoprazole Gastro-resistant 40mg',
    category: 'Gastrointestinal & Acidity',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'OD (Once Daily before breakfast)',
    defaultDuration: '14 Days',
    instructions: 'Take 30 minutes before morning breakfast.',
  },
  {
    id: 'med_4',
    name: 'Telma 40',
    generic: 'Telmisartan IP 40mg',
    category: 'Cardiovascular & Hypertension',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'OD (Once Daily morning)',
    defaultDuration: '30 Days',
    instructions: 'Maintain daily blood pressure log.',
  },
  {
    id: 'med_5',
    name: 'Glycomet-GP 1',
    generic: 'Metformin 500mg + Glimepiride 1mg',
    category: 'Antidiabetic',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'BD (Twice Daily with meals)',
    defaultDuration: '30 Days',
    instructions: 'Take immediately with breakfast and dinner.',
  },
  {
    id: 'med_6',
    name: 'Montair-LC',
    generic: 'Montelukast 10mg + Levocetirizine 5mg',
    category: 'Respiratory & Allergy',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'HS (Once Daily at bedtime)',
    defaultDuration: '10 Days',
    instructions: 'May cause mild drowsiness. Avoid night driving.',
  },
  {
    id: 'med_7',
    name: 'Azithral 500',
    generic: 'Azithromycin IP 500mg',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'OD (Once Daily 1 hr before food)',
    defaultDuration: '3 Days',
    instructions: 'Take at the exact same hour each day.',
  },
  {
    id: 'med_8',
    name: 'Rosuvas 10',
    generic: 'Rosuvastatin 10mg',
    category: 'Cardiovascular & Cholesterol',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'HS (Once Daily at night)',
    defaultDuration: '30 Days',
    instructions: 'Take after dinner. Monitor lipid profile after 6 weeks.',
  },
  {
    id: 'med_9',
    name: 'Allegra 120',
    generic: 'Fexofenadine Hydrochloride 120mg',
    category: 'Antihistamine & Allergy',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'OD (Once Daily)',
    defaultDuration: '7 Days',
    instructions: 'Non-sedating antihistamine for urticaria and rhinitis.',
  },
  {
    id: 'med_10',
    name: 'Shelcal 500',
    generic: 'Elemental Calcium 500mg + Vitamin D3 250 IU',
    category: 'Vitamins & Bone Health',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'OD (Once Daily after lunch)',
    defaultDuration: '30 Days',
    instructions: 'Drink plenty of water throughout the day.',
  },
  {
    id: 'med_11',
    name: 'Becosules Performance',
    generic: 'Vitamin B-Complex with Vitamin C & Zinc',
    category: 'Vitamins & Immunity',
    dosageForm: 'Capsule',
    defaultDosage: '1 Cap',
    defaultFrequency: 'OD (Once Daily after breakfast)',
    defaultDuration: '30 Days',
    instructions: 'Supports metabolic recovery and energy levels.',
  },
  {
    id: 'med_12',
    name: 'Meftal-Spas',
    generic: 'Mefenamic Acid 250mg + Dicyclomine 10mg',
    category: 'Antispasmodic & Pain',
    dosageForm: 'Tablet',
    defaultDosage: '1 Tab',
    defaultFrequency: 'SOS (When needed for abdominal cramps)',
    defaultDuration: 'As Needed',
    instructions: 'Take strictly after food with water.',
  },
];

export const DIAGNOSTIC_TESTS_DIRECTORY: DiagnosticTestItem[] = [
  {
    id: 'test_1',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    turnaroundTime: '4 Hours',
    fastingRequired: false,
    instructions: 'Measures RBC, WBC, Hemoglobin, Platelets, and Infection markers.',
  },
  {
    id: 'test_2',
    name: 'HbA1c & Fasting Blood Sugar (FBS)',
    category: 'Metabolic & Diabetes',
    turnaroundTime: '6 Hours',
    fastingRequired: true,
    instructions: 'Strict 8-10 hours overnight fasting required. Water is allowed.',
  },
  {
    id: 'test_3',
    name: 'Comprehensive Lipid Profile',
    category: 'Cardiac & Lipid',
    turnaroundTime: '8 Hours',
    fastingRequired: true,
    instructions: '10-12 hours overnight fast. Tests Total Cholesterol, HDL, LDL, VLDL, Triglycerides.',
  },
  {
    id: 'test_4',
    name: 'Liver Function Test (LFT Complete)',
    category: 'Biochemistry',
    turnaroundTime: '6 Hours',
    fastingRequired: true,
    instructions: 'Evaluates SGOT, SGPT, Bilirubin Total/Direct, Alkaline Phosphatase, Total Protein.',
  },
  {
    id: 'test_5',
    name: 'Kidney Function Test (KFT / RFT) + Electrolytes',
    category: 'Renal Function',
    turnaroundTime: '6 Hours',
    fastingRequired: false,
    instructions: 'Measures Blood Urea Nitrogen, Serum Creatinine, Uric Acid, Sodium, Potassium.',
  },
  {
    id: 'test_6',
    name: 'Thyroid Profile Total (T3, T4, TSH)',
    category: 'Endocrinology',
    turnaroundTime: '12 Hours',
    fastingRequired: false,
    instructions: 'Best sampled in morning hours before taking daily thyroid medication.',
  },
  {
    id: 'test_7',
    name: '12-Lead Electrocardiogram (ECG)',
    category: 'Cardiology',
    turnaroundTime: 'Instant',
    fastingRequired: false,
    instructions: 'In-clinic physical test recording electrical activity of cardiac chambers.',
  },
  {
    id: 'test_8',
    name: 'Digital Chest X-Ray PA View',
    category: 'Radiology & Imaging',
    turnaroundTime: '1 Hour',
    fastingRequired: false,
    instructions: 'Remove metallic necklaces and objects before radiography.',
  },
  {
    id: 'test_9',
    name: '2D Echocardiography with Color Doppler',
    category: 'Cardiology',
    turnaroundTime: 'Same Day',
    fastingRequired: false,
    instructions: 'Detailed ultrasound assessment of heart valves, ejection fraction, and wall motion.',
  },
  {
    id: 'test_10',
    name: 'Urine Routine & Microscopic Examination',
    category: 'Pathology',
    turnaroundTime: '3 Hours',
    fastingRequired: false,
    instructions: 'Clean-catch midstream morning urine sample in sterile container.',
  },
];
