import fs from "fs-extra";
import yaml from "js-yaml";
import { convertSpecJsonSchemaToUmsMetadata } from "./convertSpecJsonSchemaToUmsMetadata.js";
import { SpecJsonSchemaRootWithUmsSupport } from "./types.js";
import { log } from "../../util/log.js";
import { UmsPluginConfig } from "./configModel.js";

export const pluginOutputFolderName = "plugins/ums";

export function generateUmsModels(
  mainSpecSourceFilePaths: string[],
  outputPath: string,
  options: UmsPluginConfig,
): void {
  const allSpecJsonSchemaRootWithUmsSupport: SpecJsonSchemaRootWithUmsSupport[] = [];
  for (const specSourceFilePath of mainSpecSourceFilePaths) {
    // TODO: Validate the content before casting it as SpecJsonSchemaRootWithUmsSupport
    const specJsonSchemaRoot = yaml.load(
      fs.readFileSync(specSourceFilePath).toString(),
    ) as SpecJsonSchemaRootWithUmsSupport;
    allSpecJsonSchemaRootWithUmsSupport.push(specJsonSchemaRoot);
  }

  const results = convertSpecJsonSchemaToUmsMetadata(allSpecJsonSchemaRootWithUmsSupport, options);

  log.info("==========================================================================");

  fs.emptyDirSync(pluginOutputFolderName);

  for (const result of results) {
    const fileName = `${outputPath}/${result.type}/${result.metadata.name}.yaml`;
    fs.outputFileSync(
      fileName,
      yaml.dump(result, {
        lineWidth: 2000,
        forceQuotes: true,
      }),
    );
    log.info(`Written ${fileName}`);
  }
  log.info("--------------------------------------------------------------------------");
}
