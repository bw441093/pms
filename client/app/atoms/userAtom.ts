import { atom } from 'jotai';
import type { Person } from '../types';

export const userAtom = atom<Person | null>(null);

export const hasAdminAccessAtom = atom((get) => {
  const user = get(userAtom);
  if (!user?.personRoles) return false;
  const userRoles = user.personRoles.map(pr => pr.role.name);
  return userRoles.includes('hrManager') || userRoles.includes('admin');
}); 