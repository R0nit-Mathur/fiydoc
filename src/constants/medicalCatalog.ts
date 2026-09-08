/**
 * Medical Knowledge Catalog & Autocompletion Engine for FiYDOC Clinicians
 */

export interface MedicalDiagnosisItem {
  code: string;
  name: string;
  category: string;
}

export interface MedicationCatalogItem {
  name: string;
  generic: string;
  category: string;
  defaultDosage: string;
  defaultFrequency: string;
  defaultDuration: string;
  defaultTiming: string;
  defaultInstructions: string;
}

export interface LabTestCatalogItem {
  name: string;
  category: 'Biochemistry' | 'Hematology' | 'Microbiology' | 'Imaging' | 'Cardiology' | 'Other';
  fastingRequired?: boolean;
  turnaroundTime?: string;
}

export const MEDICAL_DIAGNOSES: MedicalDiagnosisItem[] = [
  // Respiratory
  { code: 'J20.9', name: 'Acute Bronchitis', category: 'Respiratory' },
  { code: 'J06.9', name: 'Acute Upper Respiratory Infection (URTI)', category: 'Respiratory' },
  { code: 'J02.9', name: 'Acute Pharyngitis / Sore Throat', category: 'Respiratory' },
  { code: 'J03.9', name: 'Acute Tonsillitis', category: 'Respiratory' },
  { code: 'J01.9', name: 'Acute Sinusitis', category: 'Respiratory' },
  { code: 'J45.9', name: 'Bronchial Asthma', category: 'Respiratory' },
  { code: 'J44.1', name: 'COPD with Acute Exacerbation', category: 'Respiratory' },
  { code: 'J18.9', name: 'Community-Acquired Pneumonia', category: 'Respiratory' },
  { code: 'J30.9', name: 'Allergic Rhinitis', category: 'Respiratory' },
  { code: 'U07.1', name: 'COVID-19 Acute Infection', category: 'Respiratory' },
  { code: 'J11.1', name: 'Influenza (Flu-like Illness)', category: 'Respiratory' },

  // Cardiovascular
  { code: 'I10', name: 'Essential (Primary) Hypertension', category: 'Cardiovascular' },
  { code: 'I25.1', name: 'Coronary Artery Disease (CAD)', category: 'Cardiovascular' },
  { code: 'I20.9', name: 'Angina Pectoris (Stable)', category: 'Cardiovascular' },
  { code: 'I50.9', name: 'Congestive Heart Failure', category: 'Cardiovascular' },
  { code: 'I48.9', name: 'Atrial Fibrillation', category: 'Cardiovascular' },
  { code: 'E78.5', name: 'Hyperlipidemia / Dyslipidemia', category: 'Cardiovascular' },
  { code: 'R00.2', name: 'Palpitations', category: 'Cardiovascular' },

  // Gastrointestinal
  { code: 'K21.9', name: 'Gastro-Esophageal Reflux Disease (GERD)', category: 'Gastrointestinal' },
  { code: 'A09', name: 'Acute Gastroenteritis / Diarrhea', category: 'Gastrointestinal' },
  { code: 'K29.7', name: 'Acute Gastritis / Dyspepsia', category: 'Gastrointestinal' },
  { code: 'K27.9', name: 'Peptic Ulcer Disease', category: 'Gastrointestinal' },
  { code: 'K58.9', name: 'Irritable Bowel Syndrome (IBS)', category: 'Gastrointestinal' },
  { code: 'K76.0', name: 'Non-Alcoholic Fatty Liver (Grade 1/2)', category: 'Gastrointestinal' },
  { code: 'K64.9', name: 'Hemorrhoids / Piles', category: 'Gastrointestinal' },
  { code: 'K59.0', name: 'Chronic Functional Constipation', category: 'Gastrointestinal' },

  // Endocrine & Metabolic
  { code: 'E11.9', name: 'Type 2 Diabetes Mellitus', category: 'Endocrine' },
  { code: 'E10.9', name: 'Type 1 Diabetes Mellitus', category: 'Endocrine' },
  { code: 'E03.9', name: 'Hypothyroidism (Primary)', category: 'Endocrine' },
  { code: 'E05.9', name: 'Hyperthyroidism / Thyrotoxicosis', category: 'Endocrine' },
  { code: 'E66.9', name: 'Obesity (BMI > 30)', category: 'Endocrine' },
  { code: 'M10.9', name: 'Hyperuricemia / Gout', category: 'Endocrine' },
  { code: 'E55.9', name: 'Vitamin D Deficiency', category: 'Endocrine' },

  // Musculoskeletal
  { code: 'M54.5', name: 'Lumbago / Mechanical Low Back Pain', category: 'Musculoskeletal' },
  { code: 'M47.8', name: 'Cervical Spondylosis', category: 'Musculoskeletal' },
  { code: 'M17.9', name: 'Osteoarthritis of Knee', category: 'Musculoskeletal' },
  { code: 'M06.9', name: 'Rheumatoid Arthritis', category: 'Musculoskeletal' },
  { code: 'M75.0', name: 'Adhesive Capsulitis (Frozen Shoulder)', category: 'Musculoskeletal' },
  { code: 'M79.1', name: 'Myalgia / Muscle Strain', category: 'Musculoskeletal' },
  { code: 'M72.2', name: 'Plantar Fasciitis', category: 'Musculoskeletal' },

  // Neurological & Psychiatric
  { code: 'G43.0', name: 'Migraine without Aura', category: 'Neurological' },
  { code: 'G44.2', name: 'Tension-Type Headache', category: 'Neurological' },
  { code: 'G62.9', name: 'Peripheral Neuropathy', category: 'Neurological' },
  { code: 'H81.1', name: 'Benign Paroxysmal Positional Vertigo (BPPV)', category: 'Neurological' },
  { code: 'F41.1', name: 'Generalized Anxiety Disorder', category: 'Neurological' },
  { code: 'F32.9', name: 'Major Depressive Episode', category: 'Neurological' },
  { code: 'G47.0', name: 'Insomnia Disorder', category: 'Neurological' },

  // Infectious Diseases
  { code: 'R50.9', name: 'Viral Fever / Acute Pyrexia', category: 'Infectious' },
  { code: 'A90', name: 'Dengue Fever', category: 'Infectious' },
  { code: 'A01.0', name: 'Typhoid (Enteric Fever)', category: 'Infectious' },
  { code: 'B54', name: 'Malaria Unspecified', category: 'Infectious' },
  { code: 'N39.0', name: 'Urinary Tract Infection (UTI)', category: 'Infectious' },

  // Dermatology
  { code: 'L20.9', name: 'Atopic Dermatitis / Eczema', category: 'Dermatology' },
  { code: 'L23.9', name: 'Allergic Contact Dermatitis', category: 'Dermatology' },
  { code: 'B35.9', name: 'Tinea / Fungal Dermatophytosis', category: 'Dermatology' },
  { code: 'L50.9', name: 'Urticaria / Hives', category: 'Dermatology' },
  { code: 'L70.0', name: 'Acne Vulgaris', category: 'Dermatology' },
  { code: 'L40.0', name: 'Psoriasis Vulgaris', category: 'Dermatology' },

  // ENT & Eye
  { code: 'H66.9', name: 'Acute Otitis Media', category: 'ENT' },
  { code: 'H10.1', name: 'Allergic Conjunctivitis', category: 'Eye' },
  { code: 'H61.2', name: 'Impacted Cerumen (Earwax)', category: 'ENT' },
];

export const MEDICATIONS_CATALOG: MedicationCatalogItem[] = [
  // Antibiotics
  {
    name: 'Augmentin 625mg',
    generic: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    category: 'Antibiotic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '5 Days',
    defaultTiming: 'After meals',
    defaultInstructions: 'Complete the full antibiotic course.',
  },
  {
    name: 'Azithromycin 500mg',
    generic: 'Azithromycin USP',
    category: 'Antibiotic',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily',
    defaultDuration: '3 Days',
    defaultTiming: '1 hour before food',
    defaultInstructions: 'Take at the same time each day.',
  },
  {
    name: 'Cefixime 200mg',
    generic: 'Cefixime Trihydrate',
    category: 'Antibiotic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '5 Days',
    defaultTiming: 'After food',
    defaultInstructions: 'For respiratory or urinary infections.',
  },
  {
    name: 'Ciprofloxacin 500mg',
    generic: 'Ciprofloxacin HCl',
    category: 'Antibiotic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '5 Days',
    defaultTiming: 'After food',
    defaultInstructions: 'Avoid antacids and dairy within 2 hours.',
  },
  {
    name: 'Doxycycline 100mg',
    generic: 'Doxycycline Hyclate',
    category: 'Antibiotic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '7 Days',
    defaultTiming: 'With a full glass of water',
    defaultInstructions: 'Do not lie down for 30 minutes after taking.',
  },

  // Analgesics & Antipyretics
  {
    name: 'Dolo 650mg',
    generic: 'Paracetamol 650mg',
    category: 'Antipyretic / Analgesic',
    defaultDosage: '1 - 0 - 1 (SOS)',
    defaultFrequency: 'Twice or thrice daily as needed',
    defaultDuration: '3 Days',
    defaultTiming: 'After food',
    defaultInstructions: 'For fever >100°F or body aches. Min 6h gap.',
  },
  {
    name: 'Combiflam',
    generic: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    category: 'NSAID / Analgesic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily after food',
    defaultDuration: '3 Days',
    defaultTiming: 'Strictly after meals',
    defaultInstructions: 'For moderate to severe pain or inflammation.',
  },
  {
    name: 'Zerodol-SP',
    generic: 'Aceclofenac (100mg) + Paracetamol (325mg) + Serratiopeptidase (15mg)',
    category: 'NSAID / Anti-inflammatory',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '5 Days',
    defaultTiming: 'After food',
    defaultInstructions: 'For swelling, trauma, or joint pain.',
  },
  {
    name: 'Meftal-Spas',
    generic: 'Mefenamic Acid (250mg) + Dicyclomine (10mg)',
    category: 'Antispasmodic',
    defaultDosage: '1 - 0 - 1 (SOS)',
    defaultFrequency: 'As needed for cramps',
    defaultDuration: '3 Days',
    defaultTiming: 'After food',
    defaultInstructions: 'For abdominal colic or menstrual spasms.',
  },

  // Antacids & Gastro
  {
    name: 'Pantocid 40mg',
    generic: 'Pantoprazole Gastro-resistant',
    category: 'Antacid / PPI',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily',
    defaultDuration: '5 Days',
    defaultTiming: '30 mins before breakfast',
    defaultInstructions: 'Swallow whole, do not crush or chew.',
  },
  {
    name: 'Pan-D Capsule',
    generic: 'Pantoprazole (40mg) + Domperidone SR (30mg)',
    category: 'Antacid / Prokinetic',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily in the morning',
    defaultDuration: '5 Days',
    defaultTiming: '30 mins before breakfast',
    defaultInstructions: 'For acid reflux and nausea.',
  },
  {
    name: 'Ondem 4mg',
    generic: 'Ondansetron HCl',
    category: 'Antiemetic',
    defaultDosage: '1 - 0 - 1 (SOS)',
    defaultFrequency: 'As needed for nausea/vomiting',
    defaultDuration: '3 Days',
    defaultTiming: '30 mins before meals',
    defaultInstructions: 'Discontinue once vomiting subsides.',
  },
  {
    name: 'Gelusil Antacid Syrup',
    generic: 'Aluminum Hydroxide + Magnesium + Simethicone',
    category: 'Antacid',
    defaultDosage: '10 ml',
    defaultFrequency: 'Thrice daily after meals',
    defaultDuration: '5 Days',
    defaultTiming: 'After meals and at bedtime',
    defaultInstructions: 'Shake bottle well before use.',
  },

  // Respiratory & Cough
  {
    name: 'Ascoril D Plus Syrup',
    generic: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
    category: 'Cough Syrup',
    defaultDosage: '10 ml',
    defaultFrequency: 'Thrice daily',
    defaultDuration: '3 Days',
    defaultTiming: 'After meals',
    defaultInstructions: 'For dry hacking cough. May cause mild drowsiness.',
  },
  {
    name: 'Alex Cough Syrup',
    generic: 'Dextromethorphan + CPM + Phenylephrine',
    category: 'Cough Syrup',
    defaultDosage: '10 ml',
    defaultFrequency: 'Thrice daily',
    defaultDuration: '5 Days',
    defaultTiming: 'After meals',
    defaultInstructions: 'For cold and allergic dry cough.',
  },
  {
    name: 'Montair-LC',
    generic: 'Montelukast (10mg) + Levocetirizine (5mg)',
    category: 'Antiallergic',
    defaultDosage: '0 - 0 - 1',
    defaultFrequency: 'Once daily at bedtime',
    defaultDuration: '10 Days',
    defaultTiming: 'Night at bedtime',
    defaultInstructions: 'For allergic rhinitis and asthma prophylaxis.',
  },
  {
    name: 'Allegra 120mg',
    generic: 'Fexofenadine HCl',
    category: 'Antihistamine',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily in the morning',
    defaultDuration: '7 Days',
    defaultTiming: 'With water (avoid fruit juice)',
    defaultInstructions: 'Non-drowsy allergy relief.',
  },
  {
    name: 'Budecort 200 Inhaler',
    generic: 'Budesonide 200mcg',
    category: 'Inhaled Corticosteroid',
    defaultDosage: '2 Puffs',
    defaultFrequency: 'Twice daily',
    defaultDuration: '30 Days',
    defaultTiming: 'Morning and Night',
    defaultInstructions: 'Rinse mouth with water after each inhalation.',
  },

  // Cardiovascular & Antihypertensive
  {
    name: 'Telma 40mg',
    generic: 'Telmisartan 40mg',
    category: 'Antihypertensive',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily in the morning',
    defaultDuration: '30 Days',
    defaultTiming: 'Morning after breakfast',
    defaultInstructions: 'Monitor BP weekly. Do not stop abruptly.',
  },
  {
    name: 'Amlodipine 5mg',
    generic: 'Amlodipine Besylate',
    category: 'Antihypertensive',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily',
    defaultDuration: '30 Days',
    defaultTiming: 'Morning',
    defaultInstructions: 'Check for pedal ankle swelling.',
  },
  {
    name: 'Rosuvas 10mg',
    generic: 'Rosuvastatin 10mg',
    category: 'Statin / Lipid Lowering',
    defaultDosage: '0 - 0 - 1',
    defaultFrequency: 'Once daily at bedtime',
    defaultDuration: '30 Days',
    defaultTiming: 'At night',
    defaultInstructions: 'For cholesterol management.',
  },
  {
    name: 'Ecosprin 75mg',
    generic: 'Aspirin Gastro-resistant 75mg',
    category: 'Antiplatelet',
    defaultDosage: '0 - 1 - 0',
    defaultFrequency: 'Once daily after lunch',
    defaultDuration: '30 Days',
    defaultTiming: 'After heavy meal',
    defaultInstructions: 'Do not take on an empty stomach.',
  },

  // Antidiabetic
  {
    name: 'Glycomet 500mg SR',
    generic: 'Metformin Sustained Release',
    category: 'Antidiabetic',
    defaultDosage: '1 - 0 - 1',
    defaultFrequency: 'Twice daily',
    defaultDuration: '30 Days',
    defaultTiming: 'With or immediately after meals',
    defaultInstructions: 'Take with food to minimize stomach upset.',
  },
  {
    name: 'Januvia 100mg',
    generic: 'Sitagliptin 100mg',
    category: 'Antidiabetic / DPP-4',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily',
    defaultDuration: '30 Days',
    defaultTiming: 'Morning with breakfast',
    defaultInstructions: 'Controls post-prandial glycemic spikes.',
  },

  // Vitamins & Supplements
  {
    name: 'Becosules Z Capsule',
    generic: 'B-Complex + Vitamin C + Zinc',
    category: 'Nutritional Supplement',
    defaultDosage: '1 - 0 - 0',
    defaultFrequency: 'Once daily',
    defaultDuration: '15 Days',
    defaultTiming: 'After lunch',
    defaultInstructions: 'Promotes mucosal healing and immunity.',
  },
  {
    name: 'Shelcal 500',
    generic: 'Calcium Carbonate (500mg) + Vitamin D3 (250 IU)',
    category: 'Calcium Supplement',
    defaultDosage: '0 - 1 - 0',
    defaultFrequency: 'Once daily after lunch',
    defaultDuration: '30 Days',
    defaultTiming: 'After meals',
    defaultInstructions: 'Supports bone density and joint health.',
  },
  {
    name: 'Uprise-D3 60K Capsule',
    generic: 'Cholecalciferol (Vitamin D3) 60,000 IU',
    category: 'Vitamin D3 Supplement',
    defaultDosage: '1 Capsule Weekly',
    defaultFrequency: 'Once every Sunday for 8 weeks',
    defaultDuration: '8 Weeks (8 Caps)',
    defaultTiming: 'With milk after dinner',
    defaultInstructions: 'Fat-soluble vitamin, best absorbed with milk.',
  },
];

export const LAB_TESTS_CATALOG: LabTestCatalogItem[] = [
  { name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology', fastingRequired: false, turnaroundTime: '4 hours' },
  { name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', fastingRequired: true, turnaroundTime: '2 hours' },
  { name: 'Post-Prandial Blood Sugar (PPBS)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '2 hours' },
  { name: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '4 hours' },
  { name: 'Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)', category: 'Biochemistry', fastingRequired: true, turnaroundTime: '6 hours' },
  { name: 'Liver Function Test (LFT Panel)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '4 hours' },
  { name: 'Kidney Function Test (KFT / RFT, Creatinine, BUN)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '4 hours' },
  { name: 'Thyroid Stimulating Hormone (TSH / Thyroid Profile)', category: 'Biochemistry', fastingRequired: true, turnaroundTime: '6 hours' },
  { name: 'Urine Routine & Microscopic Examination', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '2 hours' },
  { name: 'Chest X-Ray (PA View)', category: 'Imaging', fastingRequired: false, turnaroundTime: '1 hour' },
  { name: '12-Lead Electrocardiogram (ECG)', category: 'Cardiology', fastingRequired: false, turnaroundTime: '15 mins' },
  { name: '2D Echocardiography with Doppler', category: 'Cardiology', fastingRequired: false, turnaroundTime: '1 hour' },
  { name: 'Ultrasound Whole Abdomen & Pelvis (USG)', category: 'Imaging', fastingRequired: true, turnaroundTime: '2 hours' },
  { name: 'Serum Electrolytes (Na+, K+, Cl-)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '3 hours' },
  { name: 'Serum Vitamin D3 (25-OH)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '8 hours' },
  { name: 'Serum Vitamin B12', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '8 hours' },
  { name: 'Dengue Serology (NS1 Antigen, IgM, IgG)', category: 'Microbiology', fastingRequired: false, turnaroundTime: '3 hours' },
  { name: 'Serum Uric Acid', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '4 hours' },
  { name: 'High-Sensitivity C-Reactive Protein (hs-CRP)', category: 'Biochemistry', fastingRequired: false, turnaroundTime: '4 hours' },
];

export const LIFESTYLE_ADVICE_PRESETS = [
  'Drink warm water regularly throughout the day (2.5 - 3 Liters).',
  'Avoid cold beverages, refrigerated items, and chilled foods.',
  'Steam inhalation twice daily for 5–10 minutes with plain water.',
  'Warm saline gargles 3 times a day after meals.',
  'Maintain a low-sodium, low-cholesterol diet with plenty of leafy greens.',
  'Avoid heavy physical exertion and maintain adequate bed rest for 3 days.',
  'Avoid smoking, tobacco consumption, and alcohol exposure.',
  'Light brisk walking for 30 minutes daily once symptoms subside.',
];

/**
 * Smart Medical Autocompletion dictionary for clinical text fields
 */
export const MEDICAL_AUTOCOMPLETES: Record<string, string> = {
  // Chief Complaint
  cough: 'cough and mild chest tightness for 4 days, worsening at night. No hemoptysis.',
  fev: 'fever with chills and generalized body aches for 3 days. Max temp 101.4°F.',
  chest: 'chest tightness on exertion with mild shortness of breath. No radiation to jaw or left arm.',
  head: 'headache throbbing in bilateral temporal regions with photophobia for 2 days.',
  throat: 'throat pain and painful swallowing for 3 days with mild dry cough.',
  stom: 'stomach burning pain in epigastrium aggravated after meals and lying down.',
  back: 'back pain in lumbosacral region aggravated by forward bending and prolonged sitting.',
  breath: 'breathlessness on moderate exertion, no orthopnea, no paroxysmal nocturnal dyspnea.',
  vom: 'vomiting and watery loose stools 4-5 episodes since yesterday with mild cramps.',
  rash: 'itchy erythematous maculopapular rash over extremities and trunk for 2 days.',
  dizz: 'dizziness on sudden standing, no syncope, no vertigo or tinnitus.',
  joint: 'joint pain and stiffness in knees bilaterally, worse after morning awakening.',

  // Physical Observations & Clinical Impression
  lungs: 'lungs clear to bilateral auscultation, normal vesicular sounds, no rales or ronchi.',
  vesic: 'bilateral vesicular breath sounds heard, mild bronchial wheeze on forced expiration.',
  heart: 'heart sounds S1 and S2 audible, regular rate and rhythm, no murmurs or gallops.',
  abdo: 'abdomen soft, non-tender, no hepatosplenomegaly, normal active bowel sounds.',
  eryth: 'pharyngeal erythema present without tonsillar exudates or follicular enlargement.',
  neuro: 'alert and oriented, cranial nerves II-XII intact, motor power 5/5, sensations intact.',
  afeb: 'afebrile, hemodynamically stable, room air saturation 98%, no respiratory distress.',

  // Emergency Warnings & Instructions
  seek: 'seek immediate emergency medical care if shortness of breath, severe chest pain, or high fever (>102°F) occurs.',
  return: 'return to hospital emergency immediately if difficulty breathing, cyanosis or altered sensorium develops.',
  warn: 'warning signs: persistent chest discomfort, extreme lethargy, drop in SpO2 <95%, or unremitting high fever.',
  drink: 'drink 2.5 to 3 liters of warm boiled water daily to ensure optimal hydration.',
  avoid: 'avoid oily, spicy, acidic foods and caffeinated beverages until complete recovery.',
  steam: 'steam inhalation twice daily for 5-10 minutes with plain water.',
};
