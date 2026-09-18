import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { UsersRepo } from '../data/users.repo.js';
import { AuthUser } from '../auth-user.js';

export interface MeView {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetMe {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
  ) {}

  async execute(user: AuthUser): Promise<MeView> {
    const row = await this.database.withAnon(() =>
      this.users.findById(user.id),
    );
    if (!row) throw new NotFoundException('Account not found.');
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
