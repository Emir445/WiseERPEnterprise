import { PartialType } from '@nestjs/swagger';
import { CreateTreasuryAccountDto } from './create-treasury-account.dto';
export class UpdateTreasuryAccountDto extends PartialType(CreateTreasuryAccountDto) {}
