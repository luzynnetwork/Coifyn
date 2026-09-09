import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

/** Global so any feature module can inject {@link DatabaseService} without
 *  re-importing this module. */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
