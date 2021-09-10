import { User, Organization, ServiceMini, Role } from '@aitheon/core-server';
import { environment } from '../../environment';

export const hasAccess = (currentUser: User, currentOrganization: Organization, entity: any) => {
  if (!entity.organization) {
    const isOwner = currentUser._id.toString() === entity.user.toString();
    return isOwner;
  }
  if (!currentOrganization || (entity.organization.toString() !== currentOrganization._id.toString())) {
    return false;
  }
  const rootOrgRoles = ['Owner', 'SuperAdmin', 'OrgAdmin'];
  const orgRole = currentUser.roles.find((role: Role) => role.organization._id === currentOrganization._id);
  if (!orgRole) {
    return false;
  }
  if (rootOrgRoles.indexOf(orgRole.role) > -1) {
    return true;
  }
  const serviceRole = orgRole.services.find((service: ServiceMini) => service.service === environment.service._id);
  if (serviceRole) {
    return true;
  }

  return false;
};