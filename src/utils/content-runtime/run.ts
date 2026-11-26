import "@/utils/zod-config"
import type { ContentRuntime, ContentRuntimePart } from "./parts"
import { ContentScriptContext } from "#imports"
import { createLogger } from "@/utils/logging/logger"
import { setupContentScriptLogging } from "@/utils/logging/setup"

const log = createLogger("content-runtime")

type LoadPart = () => Promise<(ctx: ContentScriptContext) => Promise<void>>

function isPartRunning(part: ContentRuntimePart) {
  if (part === "host") return window.__READ_FROG_HOST_INJECTED__ === true
  if (part === "selection") return window.__READ_FROG_SELECTION_INJECTED__ === true
  if (part === "subtitles") return window.__READ_FROG_SUBTITLES_INJECTED__ === true
  return false
}

// Safari bundles the runtime into each loader, so use the isolated world's
// global to coordinate overlapping manifest and programmatic injections.
const scriptGlobal = globalThis as typeof globalThis & {
  __READ_FROG_STARTING_PARTS__?: Set<ContentRuntimePart>
}

export function createContentRuntime(
  loadParts: Partial<Record<ContentRuntimePart, LoadPart>>,
): ContentRuntime {
  setupContentScriptLogging()
  const startingParts = (scriptGlobal.__READ_FROG_STARTING_PARTS__ ??= new Set())

  async function runPart(part: ContentRuntimePart) {
    const load = loadParts[part]
    // A new context with a running part's name would invalidate it.
    if (!load || isPartRunning(part) || startingParts.has(part)) return
    startingParts.add(part)
    try {
      const run = await load()
      await run(new ContentScriptContext(part, { cssInjectionMode: "manual" }))
    } catch (error) {
      log.error("Content part crashed on startup", { part, error })
    } finally {
      startingParts.delete(part)
    }
  }

  return {
    async runContentParts(parts) {
      await Promise.all(parts.map(runPart))
    },
  }
}
