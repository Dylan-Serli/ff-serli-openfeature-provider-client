import { OpenFeature } from "@openfeature/web-sdk";
import SerliProvider from "./dist/index.js";

OpenFeature.setProvider(
  await SerliProvider.create(
    "94470a2be2c64036b3dcd9083c35a7007879547b0ba040e6948bb27228a7541c",
  ),
);
const client = OpenFeature.getClient();

console.log(client.getBooleanValue("bu", false));
console.log(client.getBooleanDetails("bu", false));

console.log(client.getStringValue("Simpson", "default resolved value"));
console.log(client.getStringDetails("Simpson", "default resolved value"));

console.log(client.getNumberValue("number", 0));
console.log(client.getNumberDetails("number", 0));

// console.log(await client.getObjectValue("json-flag", { version: 4 }));
// console.log(await client.getObjectDetails("json-flag", { version: 4 }));

// console.log(
//   "non existant flag (return default value of 0): ",
//   await provider.resolveNumberEvaluation("non-existant-flag", 0, context),
// );

// console.log(
//   "type mismatch flag: ",
//   await provider.resolveNumberEvaluation("my-flag", 0, context),
// );
