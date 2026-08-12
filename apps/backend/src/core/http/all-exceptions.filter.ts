import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response=host.switchToHttp().getResponse<Response>(); const request=host.switchToHttp().getRequest<Request & {requestId?:string}>();
    const status=exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw=exception instanceof HttpException ? exception.getResponse() : null;
    const message=typeof raw==='string' ? raw : raw && typeof raw==='object' && 'message' in raw ? (raw as {message:unknown}).message : status===500 ? 'Erro interno do servidor.' : 'Falha na requisicao.';
    response.status(status).json({statusCode:status,error:HttpStatus[status]??'Error',message,path:request.originalUrl,method:request.method,requestId:request.requestId,timestamp:new Date().toISOString()});
  }
}
