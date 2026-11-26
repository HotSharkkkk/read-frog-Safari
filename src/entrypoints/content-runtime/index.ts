import { defineUnlistedScript } from "#imports"
import { createContentRuntime } from "@/utils/content-runtime/run"

// The shared ES module behind the content scripts in browsers that can import
// it into the isolated world. WXT builds it with a separate chunk for each part.
export default defineUnlistedScript({
  exclude: ["safari"],
  main: () =>
    createContentRuntime({
      host: async () => (await import("./host/main")).runHostContent,
      selection: async () => (await import("./selection/main")).runSelectionContent,
      side: async () => (await import("./side/main")).runSideContent,
      subtitles: async () => (await import("./subtitles/main")).runSubtitlesContent,
    }),
})
