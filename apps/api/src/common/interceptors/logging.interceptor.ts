import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../infra/prisma.service';

/**
 * Grava api_usage_logs de forma fire-and-forget — nunca bloqueia
 * nem falha a resposta do usuário.
 */
@Injectable()
export class ApiUsageLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiUsageLoggingInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest();

    const write = (status: number): void => {
      const route = req.route?.path ?? req.url ?? 'unknown';
      this.prisma.apiUsageLog
        .create({
          data: {
            userId: req.user?.id ?? null,
            route: String(route).slice(0, 255),
            method: req.method ?? 'GET',
            status,
            latencyMs: Date.now() - start,
          },
        })
        .catch((err) => this.logger.debug(`api_usage_log falhou: ${(err as Error).message}`));
    };

    return next.handle().pipe(
      tap({
        next: () => write(http.getResponse().statusCode ?? 200),
        error: (err) => write(err?.status ?? 500),
      }),
    );
  }
}
