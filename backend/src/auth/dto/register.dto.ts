import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PublicRegisterRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;

  @IsNotEmpty({ message: 'Role is required.' })
  @IsEnum(PublicRegisterRole, { message: 'Role must be PATIENT or DOCTOR.' })
  role: PublicRegisterRole;

  @IsOptional()
  @IsString()
  fullName?: string;

  // Doctor specific fields
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  registrationAuthority?: string;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsOptional()
  @Type(() => Number)
  clinicLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  clinicLongitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Consultation fee must be a valid number.' })
  consultationFee?: number;

  @IsOptional()
  @Type(() => Number)
  experienceYears?: number;

  @IsOptional()
  @Type(() => Number)
  patientsPerSlot?: number;

  @IsOptional()
  @IsString()
  clinicTimings?: string;

  @IsOptional()
  qualifications?: string[] | string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @Type(() => Number)
  slotDurationMinutes?: number;
}
