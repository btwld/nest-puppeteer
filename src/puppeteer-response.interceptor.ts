import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  SetMetadata,
  StreamableFile,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, type Observable, tap } from "rxjs";

const RESULT_KEY = "puppeteer:resultKey";

/**
 * Declares the key name to nest the return value under in the Cloudflare
 * response wrapper.
 *
 * - `@ResultKey('html')` → `{ success: true, result: { html: <value> } }`
 * - No decorator or `@ResultKey()` → `{ success: true, result: <value> }`
 */
export const ResultKey = (key?: string) => SetMetadata(RESULT_KEY, key);

/**
 * Interceptor that:
 * 1. Wraps responses in `{ success: true, result }` (Cloudflare format)
 * 2. Adds `X-Browser-Ms-Used` response header (browser execution time)
 *
 * Binary responses (StreamableFile) are passed through untouched.
 */
@Injectable()
export class BrowserRenderingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const key = this.reflector.get<string | undefined>(RESULT_KEY, context.getHandler());

    const startMs = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - startMs;
        const response = context.switchToHttp().getResponse();
        if (response?.setHeader) {
          response.setHeader("X-Browser-Ms-Used", String(elapsed));
        }
      }),
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        const result = key ? { [key]: data } : data;
        return { success: true, result };
      }),
    );
  }
}
