import { PrismaClient, Role, VerificationStatus, ConsultationType, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FiYDoc Supabase PostgreSQL database with multiple verified specialists...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Patient User
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@fiydoc.app' },
    update: {},
    create: {
      email: 'patient@fiydoc.app',
      passwordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          fullName: 'Aarav Mehta',
          dob: '1995-06-15',
          gender: 'MALE',
          bloodGroup: 'O+',
          allergies: ['Penicillin', 'Dust Mites'],
          conditions: ['Mild Hypertension'],
          medications: ['Amlodipine 5mg'],
          onboardingComplete: true,
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        },
      },
    },
    include: { patient: true },
  });

  // 2. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fiydoc.app' },
    update: {},
    create: {
      email: 'admin@fiydoc.app',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 3. Define 5 Realistic Specialists
  const doctorsData = [
    {
      email: 'doctor@fiydoc.app',
      fullName: 'Dr. Priya Sharma',
      specialization: 'Cardiology',
      profilePhoto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      consultationFee: 800,
      languages: ['English', 'Hindi', 'Marathi'],
      regNumber: 'MCI-847291',
      regAuthority: 'Maharashtra Medical Council',
      clinicName: 'HeartCare Specialty Clinic',
      clinicAddress: 'Suite 402, Medical Enclave, Bandra West, Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      timings: '09:00 AM - 05:00 PM',
      degrees: [
        { degree: 'MD (Cardiology)', institution: 'AIIMS New Delhi', year: 2012 },
        { degree: 'MBBS (Hons)', institution: 'KMC Manipal', year: 2008 },
      ],
    },
    {
      email: 'marcus@fiydoc.app',
      fullName: 'Dr. Marcus Vance',
      specialization: 'Dermatology',
      profilePhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
      consultationFee: 650,
      languages: ['English', 'Kannada'],
      regNumber: 'KMC-492019',
      regAuthority: 'Karnataka Medical Council',
      clinicName: 'SkinCraft Advanced Aesthetics & Clinical Dermatology',
      clinicAddress: '100ft Road, Near Metro Pillar 140, Indiranagar, Bengaluru',
      latitude: 12.9719,
      longitude: 77.6412,
      timings: '10:00 AM - 06:00 PM',
      degrees: [
        { degree: 'MD (Dermatology, Venereology & Leprosy)', institution: 'St. John’s Medical College', year: 2015 },
        { degree: 'MBBS', institution: 'BMCRI Bengaluru', year: 2011 },
      ],
    },
    {
      email: 'rajesh@fiydoc.app',
      fullName: 'Dr. Rajesh Nair',
      specialization: 'Neurology',
      profilePhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
      consultationFee: 900,
      languages: ['English', 'Hindi', 'Malayalam'],
      regNumber: 'DMC-719302',
      regAuthority: 'Delhi Medical Council',
      clinicName: 'NeuroCare Brain & Spine Super Specialty Clinic',
      clinicAddress: 'Outer Ring Road, Barakhamba, Connaught Place, New Delhi',
      latitude: 28.6304,
      longitude: 77.2177,
      timings: '09:30 AM - 04:30 PM',
      degrees: [
        { degree: 'DM (Neurology)', institution: 'NIMHANS Bengaluru', year: 2010 },
        { degree: 'MD (Medicine)', institution: 'CMC Vellore', year: 2006 },
      ],
    },
    {
      email: 'sarah@fiydoc.app',
      fullName: 'Dr. Sarah Jenkins',
      specialization: 'Pediatrics',
      profilePhoto: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&q=80',
      consultationFee: 550,
      languages: ['English', 'Tamil'],
      regNumber: 'TMC-910283',
      regAuthority: 'Tamil Nadu Medical Council',
      clinicName: 'ChildFirst Pediatric & Adolescent Health Center',
      clinicAddress: '4th Block, 80 Feet Road, Koramangala, Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      timings: '09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM',
      degrees: [
        { degree: 'DNB (Pediatrics)', institution: 'National Board of Examinations', year: 2016 },
        { degree: 'MBBS', institution: 'Madras Medical College', year: 2012 },
      ],
    },
    {
      email: 'vikram@fiydoc.app',
      fullName: 'Dr. Vikram Malhotra',
      specialization: 'Orthopedics',
      profilePhoto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80',
      consultationFee: 750,
      languages: ['English', 'Hindi', 'Punjabi'],
      regNumber: 'DMC-559102',
      regAuthority: 'Delhi Medical Council',
      clinicName: 'JointCare Bone, Spine & Sports Injury Clinic',
      clinicAddress: 'A-Block, Max Hospital Complex, Saket, New Delhi',
      latitude: 28.5245,
      longitude: 77.2066,
      timings: '10:00 AM - 05:00 PM',
      degrees: [
        { degree: 'MS (Orthopedics)', institution: 'Maulana Azad Medical College', year: 2013 },
        { degree: 'Fellowship in Joint Replacement', institution: 'NHS UK', year: 2017 },
      ],
    },
  ];

  const createdDoctors = [];

  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash,
        role: Role.DOCTOR,
        doctor: {
          create: {
            fullName: doc.fullName,
            specialization: doc.specialization,
            consultationFee: doc.consultationFee,
            profilePhoto: doc.profilePhoto,
            languages: doc.languages,
            consultationModes: [ConsultationType.CLINIC],
            qualifications: {
              create: doc.degrees,
            },
            clinic: {
              create: {
                name: doc.clinicName,
                address: doc.clinicAddress,
                latitude: doc.latitude,
                longitude: doc.longitude,
                timings: doc.timings,
              },
            },
            availabilities: {
              create: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
                { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
                { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
                { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
                { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 },
              ],
            },
            verification: {
              create: {
                registrationNumber: doc.regNumber,
                registrationAuthority: doc.regAuthority,
                status: VerificationStatus.VERIFIED,
                reviewedByUserId: adminUser.id,
                reviewedAt: new Date(),
              },
            },
          },
        },
      },
      include: { doctor: { include: { clinic: true } } },
    });
    createdDoctors.push(user.doctor);
  }

  // 4. Create an Initial Confirmed In-Clinic Appointment for the patient
  if (patientUser.patient && createdDoctors[0]) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingApt = await prisma.appointment.findFirst({
      where: {
        patientId: patientUser.patient.id,
        doctorId: createdDoctors[0].id,
      },
    });

    if (!existingApt) {
      await prisma.appointment.create({
        data: {
          patientId: patientUser.patient.id,
          doctorId: createdDoctors[0].id,
          date: todayStr,
          startTime: '11:00 AM',
          endTime: '11:30 AM',
          status: AppointmentStatus.CONFIRMED,
          consultationType: ConsultationType.CLINIC,
          fee: createdDoctors[0].consultationFee,
          symptoms: ['Chest Discomfort', 'Exertional Shortness of Breath'],
          notes: 'Routine follow-up consultation regarding mild hypertension.',
        },
      });
      console.log('📅 Created sample confirmed in-clinic appointment for patient@fiydoc.app');
    }
  }

  console.log('✅ Seeding complete on Supabase PostgreSQL database!');
  console.log('👤 Patient: patient@fiydoc.app / password123');
  console.log('🩺 Primary Doctor: doctor@fiydoc.app / password123 (Dr. Priya Sharma)');
  console.log('🩺 Other Doctors: marcus@fiydoc.app, rajesh@fiydoc.app, sarah@fiydoc.app, vikram@fiydoc.app');
  console.log('🛡️ Admin: admin@fiydoc.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
