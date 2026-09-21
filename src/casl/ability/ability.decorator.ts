import { SetMetadata } from '@nestjs/common';

export const CheckAbility = (action: string, subject: string) =>
  SetMetadata('ability', [action, subject]);