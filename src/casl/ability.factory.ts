import {
  AbilityBuilder,
  Ability,
  AbilityClass,
} from '@casl/ability';

export type AppAbility = Ability<[string, string]>;

export class AbilityFactory {
 createForUser(role: any) {
  const { can, build } = new AbilityBuilder(
    Ability as AbilityClass<AppAbility>,
  );

  if (!role?.isSuperAdmin) {
    for (const rolePermission of role?.permissions ?? []) {
      const permission = rolePermission.permission;

      if (permission) {
        can(permission.action, permission.subject);
      }
    }
  }

  return build();
}
}