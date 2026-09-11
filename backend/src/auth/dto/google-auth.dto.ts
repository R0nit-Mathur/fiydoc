import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class GoogleAuthDto {
  @IsNotEmpty({ message: 'Google ID is required.' })
  @IsString()
  googleId: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Invalid Google account email.' })
  email: string;

  @IsNotEmpty({ message: 'Name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be PATIENT, DOCTOR, or ADMIN.' })
  role?: Role;
}
