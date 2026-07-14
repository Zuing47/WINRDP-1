import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Envelope<T> {
  data: T;
  meta: Record<string, any>;
}

/**
 * Envelopa todas as respostas em { data, meta }.
 * Handlers que já devolvem { data, meta } passam direto (paginação).
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Envelope<any>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'meta' in payload &&
          Object.keys(payload).length === 2
        ) {
          return payload as Envelope<any>;
        }
        return { data: payload ?? null, meta: {} };
      }),
    );
  }
}
