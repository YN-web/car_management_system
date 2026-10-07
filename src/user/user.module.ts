import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { AuditModule } from '../audit/audit.module';
@Module({
  imports: [
    PrismaModule,
    CaslModule,
    AuthModule,
    PassportModule,
    AuditModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}