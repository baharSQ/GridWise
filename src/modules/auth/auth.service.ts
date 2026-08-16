import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginResponseDto } from './dto/login-response.dto';

const PASSWORD_SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES_IN = '1h';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUserDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
    });
    const savedUser = await this.userRepository.save(user);

    return this.toUserResponse(savedUser);
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      },
    );

    return { accessToken };
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });
    return this.toUserResponse(user);
  }

  private toUserResponse(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
