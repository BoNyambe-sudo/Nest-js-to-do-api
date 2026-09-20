import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      message =
        (exceptionResponse as { message?: string | string[] }).message ??
        exceptionResponse;
    }

    const errorResponse = {
      statusCode: status,
      message,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn(
      `${status} ${request.method} ${request.url} - ${JSON.stringify(message)}`,
    );

    response.status(status).json(errorResponse);
  }
}
