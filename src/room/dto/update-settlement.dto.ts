import { PartialType } from '@nestjs/swagger';

import { CreateSettlementDto } from './create-settlement.dto';

export class UpdateSettlementDto extends PartialType(CreateSettlementDto) {}
