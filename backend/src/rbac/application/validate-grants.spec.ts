import { BadRequestException } from '@nestjs/common';
import { validateGrants } from './create-role.js';

describe('validateGrants', () => {
  it('accepts a valid set', () => {
    expect(() =>
      validateGrants([
        { permissionKey: 'service:manage', scope: 'org' },
        { permissionKey: 'queue:manage', scope: 'branch' },
      ]),
    ).not.toThrow();
  });

  it('rejects an unknown permission key', () => {
    expect(() =>
      validateGrants([{ permissionKey: 'made:up', scope: 'org' }]),
    ).toThrow(BadRequestException);
  });

  it('rejects branch scope on a non-scopable permission', () => {
    expect(() =>
      validateGrants([{ permissionKey: 'role:create', scope: 'branch' }]),
    ).toThrow(BadRequestException);
  });

  it('rejects a duplicate permission', () => {
    expect(() =>
      validateGrants([
        { permissionKey: 'service:view', scope: 'org' },
        { permissionKey: 'service:view', scope: 'branch' },
      ]),
    ).toThrow(BadRequestException);
  });
});
