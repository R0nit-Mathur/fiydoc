import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Sparkles,
  Smile,
  Baby,
  Bone,
  Flower2,
  Eye,
  Ear,
  Brain,
  Activity,
  Apple,
  Accessibility,
  Droplets,
  Flame,
  Syringe,
  ShieldAlert,
  ShieldPlus,
  Pill,
  Leaf,
  Microscope,
  LucideIcon,
} from 'lucide-react-native';

export interface SpecialtyConfig {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  lightBg: string;
}

export const ALL_SPECIALTIES: SpecialtyConfig[] = [
  {
    id: 'general_physician',
    name: 'General Physician',
    desc: 'Fever, Cold, Flu & General Health',
    icon: Stethoscope,
    color: '#2563eb',
    lightBg: '#EFF6FF',
  },
  {
    id: 'general_medicine',
    name: 'General Medicine',
    desc: 'Primary Care, Fever, Infection & Health',
    icon: Stethoscope,
    color: '#2563eb',
    lightBg: '#EFF6FF',
  },
  {
    id: 'cardiologist',
    name: 'Cardiologist',
    desc: 'Heart Health, BP & ECG Checks',
    icon: HeartPulse,
    color: '#e11d48',
    lightBg: '#FFF1F2',
  },
  {
    id: 'dermatologist',
    name: 'Dermatologist',
    desc: 'Skin Care, Acne, Hair & Nails',
    icon: Sparkles,
    color: '#0d9488',
    lightBg: '#F0FDFA',
  },
  {
    id: 'dentist',
    name: 'Dentist',
    desc: 'Teeth, Root Canal, Gums & Cleaning',
    icon: Smile,
    color: '#0891b2',
    lightBg: '#ECFEFF',
  },
  {
    id: 'pediatrician',
    name: 'Pediatrician',
    desc: 'Child Care, Growth & Vaccination',
    icon: Baby,
    color: '#d97706',
    lightBg: '#FFFBEB',
  },
  {
    id: 'orthopedic',
    name: 'Orthopedic',
    desc: 'Bones, Joints, Fractures & Spine',
    icon: Bone,
    color: '#4f46e5',
    lightBg: '#EEF2FF',
  },
  {
    id: 'gynecologist',
    name: 'Gynecologist',
    desc: "Women's Health, Pregnancy & Wellness",
    icon: Flower2,
    color: '#db2777',
    lightBg: '#FDF2F8',
  },
  {
    id: 'eye_specialist',
    name: 'Eye Specialist',
    desc: 'Vision Check, Cataract & Glaucoma',
    icon: Eye,
    color: '#7c3aed',
    lightBg: '#F5F3FF',
  },
  {
    id: 'ent_specialist',
    name: 'ENT Specialist',
    desc: 'Ear, Nose, Throat & Sinus',
    icon: Ear,
    color: '#0284c7',
    lightBg: '#F0F9FF',
  },
  {
    id: 'neurologist',
    name: 'Neurologist',
    desc: 'Nerves, Migraine, Epilepsy & Brain',
    icon: Brain,
    color: '#9333ea',
    lightBg: '#FAF5FF',
  },
  {
    id: 'pulmonologist',
    name: 'Pulmonologist',
    desc: 'Lungs, Asthma, Allergy & Breathing',
    icon: Activity,
    color: '#059669',
    lightBg: '#ECFDF5',
  },
  {
    id: 'psychiatrist',
    name: 'Psychiatrist',
    desc: 'Mental Health, Anxiety & Therapy',
    icon: Pill,
    color: '#6366f1',
    lightBg: '#EEF2FF',
  },
  {
    id: 'gastroenterologist',
    name: 'Gastroenterologist',
    desc: 'Stomach, Digestion, Liver & Gut',
    icon: Stethoscope,
    color: '#ea580c',
    lightBg: '#FFF7ED',
  },
  {
    id: 'nutritionist',
    name: 'Dietitian & Nutritionist',
    desc: 'Weight Loss, Diet Plans & Wellness',
    icon: Apple,
    color: '#16a34a',
    lightBg: '#F0FDF4',
  },
  {
    id: 'physiotherapist',
    name: 'Physiotherapist',
    desc: 'Rehab, Muscle Rehab & Posture',
    icon: Accessibility,
    color: '#0284c7',
    lightBg: '#F0F9FF',
  },
  {
    id: 'urologist',
    name: 'Urologist',
    desc: 'Kidney Stones, Urinary Health & Bladder',
    icon: Droplets,
    color: '#2563eb',
    lightBg: '#EFF6FF',
  },
  {
    id: 'endocrinologist',
    name: 'Endocrinologist',
    desc: 'Diabetes, Thyroid & Hormones',
    icon: Flame,
    color: '#dc2626',
    lightBg: '#FEF2F2',
  },
  {
    id: 'general_surgeon',
    name: 'General Surgeon',
    desc: 'Hernia, Appendix & Minor Surgeries',
    icon: Syringe,
    color: '#475569',
    lightBg: '#F8FAFC',
  },
  {
    id: 'oncologist',
    name: 'Oncologist',
    desc: 'Cancer Screening, Care & Treatment',
    icon: ShieldAlert,
    color: '#b91c1c',
    lightBg: '#FEF2F2',
  },
  {
    id: 'rheumatologist',
    name: 'Rheumatologist',
    desc: 'Arthritis, Autoimmune & Joint Swelling',
    icon: ShieldPlus,
    color: '#7c3aed',
    lightBg: '#F5F3FF',
  },
  {
    id: 'nephrologist',
    name: 'Nephrologist',
    desc: 'Kidney Health, Dialysis & Creatinine',
    icon: Droplets,
    color: '#0284c7',
    lightBg: '#F0F9FF',
  },
  {
    id: 'ayurveda',
    name: 'Ayurvedic Specialist',
    desc: 'Holistic & Traditional Herbal Care',
    icon: Leaf,
    color: '#15803d',
    lightBg: '#F0FDF4',
  },
  {
    id: 'homeopathy',
    name: 'Homeopathy',
    desc: 'Gentle & Natural Chronic Care',
    icon: Leaf,
    color: '#047857',
    lightBg: '#ECFDF5',
  },
  {
    id: 'radiologist',
    name: 'Diagnostic Radiologist',
    desc: 'X-Ray, Ultrasound, CT & MRI Scans',
    icon: Microscope,
    color: '#4338ca',
    lightBg: '#EEF2FF',
  },
];

// Curated top 8 specialties for quick home feed carousel
export const SPECIALTIES: SpecialtyConfig[] = ALL_SPECIALTIES.slice(0, 8);

export function getSpecialtyConfig(specialtyName?: string): SpecialtyConfig {
  if (!specialtyName) {
    return ALL_SPECIALTIES[0];
  }

  const s = specialtyName.toLowerCase().trim();

  const found = ALL_SPECIALTIES.find(
    (item) =>
      item.name.toLowerCase() === s ||
      s.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(s)
  );

  if (found) return found;

  if (s.includes('cardio') || s.includes('heart')) return ALL_SPECIALTIES[1];
  if (s.includes('derma') || s.includes('skin')) return ALL_SPECIALTIES[2];
  if (s.includes('dent') || s.includes('teeth') || s.includes('oral')) return ALL_SPECIALTIES[3];
  if (s.includes('pediat') || s.includes('child') || s.includes('baby')) return ALL_SPECIALTIES[4];
  if (s.includes('ortho') || s.includes('bone') || s.includes('joint')) return ALL_SPECIALTIES[5];
  if (s.includes('gynec') || s.includes('women') || s.includes('obgyn')) return ALL_SPECIALTIES[6];
  if (s.includes('eye') || s.includes('ophthalm') || s.includes('vision')) return ALL_SPECIALTIES[7];
  if (s.includes('ent') || s.includes('ear') || s.includes('throat')) return ALL_SPECIALTIES[8];
  if (s.includes('neuro') || s.includes('brain')) return ALL_SPECIALTIES[9];
  if (s.includes('pulmo') || s.includes('chest') || s.includes('breath')) return ALL_SPECIALTIES[10];
  if (s.includes('psych') || s.includes('mental')) return ALL_SPECIALTIES[11];
  if (s.includes('gastro') || s.includes('stomach') || s.includes('gut')) return ALL_SPECIALTIES[12];
  if (s.includes('diet') || s.includes('nutri')) return ALL_SPECIALTIES[13];
  if (s.includes('physio')) return ALL_SPECIALTIES[14];
  if (s.includes('uro')) return ALL_SPECIALTIES[15];
  if (s.includes('endo') || s.includes('diabet')) return ALL_SPECIALTIES[16];
  if (s.includes('surg')) return ALL_SPECIALTIES[17];
  if (s.includes('onco') || s.includes('cancer')) return ALL_SPECIALTIES[18];
  if (s.includes('rheum') || s.includes('arthrit')) return ALL_SPECIALTIES[19];
  if (s.includes('nephro') || s.includes('kidney')) return ALL_SPECIALTIES[20];
  if (s.includes('ayur')) return ALL_SPECIALTIES[21];
  if (s.includes('homeo')) return ALL_SPECIALTIES[22];
  if (s.includes('radio') || s.includes('scan') || s.includes('xray')) return ALL_SPECIALTIES[23];

  return ALL_SPECIALTIES[0];
}
