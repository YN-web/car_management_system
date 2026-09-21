import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: (request) => {
        const auth = request.headers.authorization;
        if (!auth) return null;

        const [type, token] = auth.split(' ');
        return type === 'Bearer' ? token : null;
      },
      ignoreExpiration: false,
      secretOrKey: 'car-management-secret',
    });
  }

  async validate(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
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
  }
}