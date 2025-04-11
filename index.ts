import {
  ErrorCode,
  EvaluationContext,
  FlagValue,
  JsonValue,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
  ProviderMetadata,
  ResolutionDetails,
  StandardResolutionReasons,
} from "@openfeature/web-sdk";
import { FlagType, typeFactory } from "./type-factory.js";

export default class SerliProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: SerliProvider.name,
  };

  readonly runsOn = "client";
  private readonly API_URL: string;
  private api_key = "";
  private flags: { [index: string]: any } = {};

  events = new OpenFeatureEventEmitter();

  private constructor(api_key: string, api_url?: string) {
    this.api_key = api_key;
    this.API_URL = api_url || "http://localhost:3333/api/flags/";
  }

  public static async create(api_key: string, api_url?: string) {
    let provider = new SerliProvider(api_key, api_url);
    await provider.init();
    return provider;
  }

  async init() {
    //fetch all flags at startup
    const response = await fetch(this.API_URL, {
      method: "GET",
      headers: {
        Authorization: `${this.api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flags: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.error) {
      throw new Error(`Error when fetching flags: ${response.statusText}`);
    }

    this.flags = data;
  }

  onContextChange(
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
    this.events.emit(ProviderEvents.Stale, { message: "Context Changed" });
    return new Promise<void>((resolve, reject) => {
      this.init()
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  resolveBooleanEvaluation(flagKey: string) {
    return this.evaluate<boolean>(flagKey, "boolean", false);
  }

  resolveStringEvaluation(flagKey: string, defaultValue: string) {
    return this.evaluate<string>(flagKey, "string", defaultValue);
  }

  resolveNumberEvaluation(flagKey: string, defaultValue: number) {
    return this.evaluate<number>(flagKey, "number", defaultValue);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
  ) {
    return this.evaluate<T>(flagKey, "object", defaultValue);
  }

  private evaluate<T extends FlagValue>(
    flagKey: string,
    type: FlagType,
    defaultValue: T,
  ) {
    const value = typeFactory(this.getValue(flagKey), type);
    if (typeof value !== "undefined" && typeof value !== type) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.TYPE_MISMATCH,
        errorMessage: `Flag ${flagKey} is not of type ${type}`,
      } as ResolutionDetails<T>;
    }
    if (typeof value !== undefined && typeof value !== type) {
      return {
        value: defaultValue as T,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        errorMessage: `Flag ${flagKey} not found`,
      } as ResolutionDetails<T>;
    } else {
      return {
        value: value as T,
        reason: StandardResolutionReasons.CACHED,
      } as ResolutionDetails<T>;
    }
  }

  private getValue(flagKey: string): any {
    if (!this.flags.hasOwnProperty(flagKey)) {
      return undefined;
    }
    const flag = this.flags[flagKey];
    if (flag && flag.defaultRule && flag.variations) {
      const variationKey = flag.defaultRule.variation;
      return flag.variations[variationKey];
    }
    return undefined;
  }
}
