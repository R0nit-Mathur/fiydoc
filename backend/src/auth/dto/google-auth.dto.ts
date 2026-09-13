import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsNotEmpty({ message: 'Google authentication credential (idToken or server token) is required.' })
  @IsString()
  credential: string;

  @IsOptional()
  @IsString()
  role?: string;
}

