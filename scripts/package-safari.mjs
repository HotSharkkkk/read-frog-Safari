import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const extensionPath = path.resolve(process.argv[2] ?? ".output/safari-mv3")
const projectPath = path.resolve(process.argv[3] ?? "safari")

if (!existsSync(path.join(extensionPath, "manifest.json"))) {
  throw new Error(`Safari build not found at ${extensionPath}. Run pnpm build:safari first.`)
}

const packager = ["safari-web-extension-packager", "safari-web-extension-converter"].find(
  (tool) => spawnSync("xcrun", ["--find", tool], { stdio: "ignore" }).status === 0,
)
if (!packager) {
  throw new Error("Install and select the full Xcode app to generate a macOS Safari project.")
}

mkdirSync(projectPath, { recursive: true })
execFileSync(
  "xcrun",
  [
    packager,
    extensionPath,
    "--project-location",
    projectPath,
    "--app-name",
    "Read Frog",
    "--bundle-identifier",
    "app.readfrog.safari",
    "--macos-only",
    "--swift",
    "--copy-resources",
    "--no-open",
    "--no-prompt",
  ],
  { stdio: "inherit" },
)
