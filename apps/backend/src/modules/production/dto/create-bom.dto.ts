import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from 'class-validator';
export class CreateBomItemDto { @IsUUID() productId!:string; @Type(()=>Number) @IsNumber() @Min(0.0001) quantity!:number; @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) lossPercent?:number; @IsOptional() @IsString() notes?:string; }
export class CreateBomDto { @IsUUID() productId!:string; @IsString() @MinLength(2) name!:string; @IsOptional() @Type(()=>Number) @IsNumber() @Min(0.0001) yieldQuantity?:number; @IsOptional() @IsString() notes?:string; @IsArray() @ValidateNested({each:true}) @Type(()=>CreateBomItemDto) items!:CreateBomItemDto[]; }
