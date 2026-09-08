import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Role } from '@prisma/client';

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
  @IsEnum(Role, { message: 'Role must be PATIENT or DOCTOR.' })
  role: Role;

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
  clinicLatitude?: number;

  @IsOptional()
  clinicLongitude?: number;

  @IsOptional()
  consultationFee?: number;

  @IsOptional()
  qualifications?: string[];
}
