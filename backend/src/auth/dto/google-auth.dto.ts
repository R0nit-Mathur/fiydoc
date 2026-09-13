import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { PublicRegisterRole } from './register.dto';

export class GoogleAuthDto {
  @IsNotEmpty({ message: 'Google authentication credential (idToken or server token) is required.' })
  @IsString()
  credential: string;

  @IsOptional()
  @IsEnum(PublicRegisterRole, { message: 'Role must be PATIENT or DOCTOR.' })
  role?: PublicRegisterRole;
}

