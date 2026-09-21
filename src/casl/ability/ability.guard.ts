import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../ability.factory';

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAbility = this.reflector.get<
      [string, string]
    >('ability', context.getHandler());

    if (!requiredAbility) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    if (user.role?.isSuperAdmin) {
     return true;
    }

    const ability = this.abilityFactory.createForUser(user.role);

    const [action, subject] = requiredAbility;

    if (!ability.can(action, subject)) {
      throw new ForbiddenException(
        `You cannot ${action} ${subject}`,
      );
    }

    return true;
  }
}