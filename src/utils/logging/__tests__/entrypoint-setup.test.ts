import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

// Each bundle has its own copy of the logger, and a bundle whose entrypoint
// never sets logging up drops every record in production. This keeps a new
// entrypoint from shipping that way unnoticed.

const ENTRYPOINTS_DIR = path.resolve("src/entrypoints")

const EXTENSION_PAGES = ["offscreen", "options", "popup", "sidepanel", "translation-hub"]

// Bootstraps injected into a great many frames, kept as small as they can be.
// They log nothing themselves; what they load sets up its own logging.
const CONTENT_LOADERS = [
  "loader.content.ts",
  "subtitles-loader.content.ts",
  "ebook-section.content.ts",
]
const EXEMPT = new Set([...CONTENT_LOADERS, "iframe-selection-trigger.content.ts"])

// WXT builds a folder only when it has an index file in it
function isEntrypoint(name: string): boolean {
  if (name.includes(".") && !name.endsWith(".content")) return true
  return readdirSync(path.join(ENTRYPOINTS_DIR, name)).some((file) =>
    /^index\.(?:html|[jt]sx?)$/.test(file),
  )
}

function entryFile(name: string): string {
  const entry = path.join(ENTRYPOINTS_DIR, name)
  if (!name.includes(".") || name.endsWith(".content")) {
    const file = ["index.ts", "index.tsx", "main.ts", "main.tsx"]
      .map((candidate) => path.join(entry, candidate))
      .find((candidate) => existsSync(candidate))
    if (!file) throw new Error(`No entry file in ${name}`)
    return file
  }
  return entry
}

const entrypoints = readdirSync(ENTRYPOINTS_DIR)
  .filter((name) => name !== "__tests__" && !EXEMPT.has(name) && isEntrypoint(name))
  .map((name) => ({ name, source: readFileSync(entryFile(name), "utf8") }))

const isMainWorld = (source: string) => /world:\s*"MAIN"/.test(source)

function setupCallFor(name: string): string {
  if (name === "background") return "setupBackgroundLogging()"
  if (name === "content-runtime") return "createContentRuntime("
  if (EXTENSION_PAGES.includes(name)) return `setupExtensionPageLogging("${name}")`
  return "setupContentScriptLogging()"
}

const loggingEntrypoints = entrypoints
  .filter(({ source }) => !isMainWorld(source))
  .map(({ name, source }) => ({ name, source, call: setupCallFor(name) }))

const mainWorldEntrypoints = entrypoints.filter(({ source }) => isMainWorld(source))

describe("entrypoint logging setup", () => {
  it("finds the entrypoints", () => {
    expect(entrypoints.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["background", "content-runtime", ...EXTENSION_PAGES]),
    )
  })

  it.each(loggingEntrypoints)("$name calls $call", ({ source, call }) => {
    expect(source).toContain(call)
  })

  it("sets up logging in the shared content runtime factory", () => {
    const source = readFileSync(path.resolve("src/utils/content-runtime/run.ts"), "utf8")
    expect(source).toContain("setupContentScriptLogging()")
  })

  it.each(CONTENT_LOADERS)("%s calls the content runtime factory on Safari", (name) => {
    const source = readFileSync(entryFile(name), "utf8")
    expect(source).toMatch(/import\.meta\.env\.BROWSER === "safari"[\s\S]*?createContentRuntime\(/)
  })

  // The page's own world has no extension APIs to forward records with.
  it.each(mainWorldEntrypoints)("$name, in the page's own world, sets none up", ({ source }) => {
    expect(source).not.toMatch(/setup\w*Logging\(/)
  })
})
