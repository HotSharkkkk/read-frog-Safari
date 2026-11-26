import { defineContentScript } from "#imports"
import { runContentLoader } from "@/utils/content-runtime/loader"
import { takeRequestedParts } from "@/utils/content-runtime/parts"

export default defineContentScript({
  matches: import.meta.env.BROWSER === "safari" ? ["*://*/*"] : ["*://*/*", "file:///*"],
  async main() {
    await runContentLoader(takeRequestedParts(globalThis, window === window.top), {
      loadRuntime:
        import.meta.env.BROWSER === "safari"
          ? async () => {
              const { createContentRuntime } = await import("@/utils/content-runtime/run")
              return createContentRuntime({
                host: async () => (await import("./content-runtime/host/main")).runHostContent,
                selection: async () =>
                  (await import("./content-runtime/selection/main")).runSelectionContent,
                side: async () => (await import("./content-runtime/side/main")).runSideContent,
              })
            }
          : undefined,
    })
  },
})
