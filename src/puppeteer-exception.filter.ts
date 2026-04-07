import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

interface BrowserRenderingError {
  code: number;
  message: string;
}

/**
 * Exception filter that returns errors in the Cloudflare Browser Rendering
 * format: `{ success: false, errors: [{ code, message }] }`.
 *
 * Registered as APP_FILTER — applies to all puppeteer REST controllers
 * without needing @UseFilters().
 */
@Catch()
export class BrowserRenderingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BrowserRenderingExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const { status, errors } = this.extractError(exception);

    this.logger.error(
      `Browser rendering error [${status}]: ${errors.map((e) => e.message).join(", ")}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      errors,
    });
  }

  private extractError(exception: unknown): {
    status: number;
    errors: BrowserRenderingError[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === "string") {
        return { status, errors: [{ code: status, message: response }] };
      }

      if (typeof response === "object" && response !== null) {
        const res = response as Record<string, any>;
        const message = Array.isArray(res.message)
          ? res.message
          : [res.message ?? res.error ?? "Unknown error"];

        return {
          status,
          errors: message.map((msg: string) => ({ code: status, message: msg })),
        };
      }

      return {
        status,
        errors: [{ code: status, message: exception.message }],
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: [{ code: HttpStatus.INTERNAL_SERVER_ERROR, message: exception.message }],
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errors: [{ code: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" }],
    };
  }
}
