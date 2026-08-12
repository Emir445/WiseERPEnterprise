import { Type } from 'class-transformer'; import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
export class CreateServiceOrderDto { @IsUUID() branchId!:string; @IsUUID() customerId!:string; @IsOptional() @IsUUID() assignedUserId?:string; @IsString() number!:string; @IsString() title!:string; @IsOptional() @IsString() description?:string; @IsOptional() @IsEnum(['LOW','NORMAL','HIGH','URGENT']) priority?:any; @IsOptional() @IsString() notes?:string; }
export class AddMaterialDto { @IsUUID() productId!:string; @Type(()=>Number) @IsNumber() @Min(0.0001) quantity!:number; }
export class AddTimeDto { @IsOptional() @IsUUID() userId?:string; @Type(()=>Number) @IsInt() @Min(1) minutes!:number; @Type(()=>Number) @IsNumber() @Min(0) hourlyRate!:number; @IsOptional() @IsString() notes?:string; }
export class InvoiceServiceOrderDto { @IsString() saleNumber!:string; @IsOptional() @IsUUID() paymentTermId?:string; }
