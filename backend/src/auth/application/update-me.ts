import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { UsersRepo } from '../data/users.repo.js';
import { AuthUser } from '../auth-user.js';
import { UpdateMeDto } from '../dto/auth.dto.js';
import { GetMe, MeView } from './get-me.js';

@Injectable()
export class UpdateMe {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
    private readonly getMe: GetMe,
  ) {}

  async execute(user: AuthUser, dto: UpdateMeDto): Promise<MeView> {
    const row = await this.database.withAnon(() =>
      this.users.updateProfile(user.id, { displayName: dto.displayName }),
    );
    if (!row) throw new NotFoundException('Account not found.');
    return this.getMe.execute(user);
  }
}
