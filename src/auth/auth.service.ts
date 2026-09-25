import {
  Injectable,
  UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,

    
  ) {}

  async signup(signupDto: SignupDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: {
      email: signupDto.email,
    },
  });

  if (existingUser) {
    throw new BadRequestException('Email is already registered');
  }

  const userCount = await this.prisma.user.count();

  let roleId: string;

  if (userCount === 0) {
    const superAdminRole = await this.prisma.role.findFirst({
      where: {
        isSuperAdmin: true,
      },
    });

    if (!superAdminRole) {
      throw new BadRequestException(
        'Super_Admin role has not been created',
      );
    }

    roleId = superAdminRole.id;
  } else {
    throw new BadRequestException(
      'Public signup is only available for the first user',
    );
  }

  const hashedPassword = await bcrypt.hash(signupDto.password, 10);

  return this.prisma.user.create({
    data: {
      name: signupDto.name,
      email: signupDto.email,
      password: hashedPassword,
      enterpriseId: signupDto.enterpriseId,
      roleId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      enterpriseId: true,
      roleId: true,
      isActive: true,
      createdAt: true,
    },
  });
}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}