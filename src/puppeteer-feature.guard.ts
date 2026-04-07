import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type {
  PuppeteerFeature,
  PuppeteerRestOptions,
} from "./interfaces/puppeteer-module-options.interface.js";
import { ALL_FEATURES, FEATURE_KEY, PUPPETEER_REST_OPTIONS } from "./puppeteer.constants.js";

/**
 * Marks a controller method as belonging to a specific Puppeteer feature.
 * Used by PuppeteerFeatureGuard to check if the feature is enabled.
 */
export const Feature = (feature: PuppeteerFeature) => SetMetadata(FEATURE_KEY, feature);

/**
 * Guard that checks whether a Puppeteer feature endpoint is enabled.
 * Returns 404 for disabled features.
 */
@Injectable()
export class PuppeteerFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PUPPETEER_REST_OPTIONS)
    private readonly restOptions: PuppeteerRestOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<PuppeteerFeature>(FEATURE_KEY, context.getHandler());

    if (!feature) return true;

    const enabledFeatures = this.restOptions.features ?? ALL_FEATURES;

    if (!enabledFeatures.includes(feature)) {
      throw new NotFoundException();
    }

    return true;
  }
}
