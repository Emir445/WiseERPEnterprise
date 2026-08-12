import { Type } from 'class-transformer'; import { IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
export class CreateProductionOrderDto { @IsUUID() branchId!:string; @IsUUID() bomId!:string; @IsString() @MinLength(2) number!:string; @Type(()=>Number) @IsNumber() @Min(0.0001) quantity!:number; @IsOptional() @IsString() notes?:string; }
