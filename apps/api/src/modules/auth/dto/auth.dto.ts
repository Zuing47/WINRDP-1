import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'maria@exemplo.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'demo@priceai.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token emitido no login' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'id_token do Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
