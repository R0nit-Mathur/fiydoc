import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { RecordsModule } from './records/records.module';
import { VerificationModule } from './verification/verification.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production', '../.env', '../.env.production'],
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    DoctorsModule,
    AppointmentsModule,
    ConsultationsModule,
    PrescriptionsModule,
    RecordsModule,
    VerificationModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
