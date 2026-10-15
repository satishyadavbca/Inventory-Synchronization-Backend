import { IsInt, Min, Max } from 'class-validator';

export class GenerateBulkLicensesDto {
  @IsInt()
  @Min(1, { message: 'Must generate at least 1 key' })
  @Max(1000, { message: 'Cannot generate more than 1000 keys at once to prevent timeouts' })
  count: number;
}