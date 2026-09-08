import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
