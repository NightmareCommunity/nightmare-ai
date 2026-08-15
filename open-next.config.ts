import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  incrementalCache: undefined,
  tagCache: undefined,
  queue: "direct",
});
