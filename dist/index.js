import { ErrorCode, OpenFeatureEventEmitter, ProviderEvents, StandardResolutionReasons, } from "@openfeature/web-sdk";
import { typeFactory } from "./type-factory.js";
export default class SerliProvider {
    metadata = {
        name: SerliProvider.name,
    };
    runsOn = "client";
    API_URL = "http://localhost:3328/api/v1/flags/";
    api_key = "";
    flags = {};
    events = new OpenFeatureEventEmitter();
    constructor(api_key) {
        this.api_key = api_key;
    }
    static async create(api_key) {
        let provider = new SerliProvider(api_key);
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
    onContextChange(oldContext, newContext) {
        this.events.emit(ProviderEvents.Stale, { message: "Context Changed" });
    }
    resolveBooleanEvaluation(flagKey) {
        return this.evaluate(flagKey, "boolean", false);
    }
    resolveStringEvaluation(flagKey, defaultValue) {
        return this.evaluate(flagKey, "string", defaultValue);
    }
    resolveNumberEvaluation(flagKey, defaultValue) {
        return this.evaluate(flagKey, "number", defaultValue);
    }
    resolveObjectEvaluation(flagKey, defaultValue) {
        return this.evaluate(flagKey, "object", defaultValue);
    }
    evaluate(flagKey, type, defaultValue) {
        const value = typeFactory(this.getValue(flagKey), type);
        if (typeof value !== "undefined" && typeof value !== type) {
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.TYPE_MISMATCH,
                errorMessage: `Flag ${flagKey} is not of type ${type}`,
            };
        }
        if (typeof value !== undefined && typeof value !== type) {
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.FLAG_NOT_FOUND,
                errorMessage: `Flag ${flagKey} not found`,
            };
        }
        else {
            return {
                value: value,
                reason: StandardResolutionReasons.CACHED,
            };
        }
    }
    getValue(flagKey) {
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