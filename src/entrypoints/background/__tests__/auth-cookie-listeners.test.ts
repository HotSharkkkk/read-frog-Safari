import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fakeBrowser } from "wxt/testing/fake-browser"
import { browser } from "#imports"
import { env } from "@/env"
import { AUTH_CACHE_GROUP_KEY } from "@/utils/constants/proxy-fetch"
import * as pendingSave from "@/utils/notebase/pending-save"
import { SessionCacheGroupRegistry } from "@/utils/session-cache/session-cache-group-registry"
import { setupNotebasePendingSaveProcessor } from "../notebase-pending-save"
import { proxyFetch } from "../proxy-fetch"

vi.mock("@/utils/message", () => ({ onMessage: vi.fn<() => void>() }))

/** Capture the registered callbacks once the startup save check has finished. */
async function registerCookieListeners() {
  const addListener = vi
    .spyOn(browser.cookies.onChanged, "addListener")
    .mockImplementation(() => {})
  const getPendingSave = vi.spyOn(pendingSave, "getPendingNotebaseSave").mockResolvedValue(null)
  const getCacheGroup = vi.spyOn(SessionCacheGroupRegistry, "getCacheGroup")

  proxyFetch()
  setupNotebasePendingSaveProcessor(async () => {})

  await vi.waitFor(() => expect(getPendingSave).toHaveBeenCalledOnce())
  getPendingSave.mockClear()
  expect(addListener).toHaveBeenCalledTimes(2)

  /** Dispatch browser-provided arguments, including Safari's empty events. */
  function dispatchCookieChange(...args: unknown[]) {
    return Promise.allSettled(
      addListener.mock.calls.map(async ([listener]) => Reflect.apply(listener, undefined, args)),
    )
  }

  return { dispatchCookieChange, getPendingSave, getCacheGroup }
}

describe("background auth cookie listeners", () => {
  beforeEach(() => {
    fakeBrowser.reset()
    vi.spyOn(browser.permissions.onAdded, "addListener").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it.each([[], [null], [{}], [{ cookie: null }]])(
    "ignores cookie changes without details (%j)",
    async (...args) => {
      const { dispatchCookieChange, getPendingSave, getCacheGroup } =
        await registerCookieListeners()

      expect(await dispatchCookieChange(...args)).toEqual([
        { status: "fulfilled", value: undefined },
        { status: "fulfilled", value: undefined },
      ])
      expect(getPendingSave).not.toHaveBeenCalled()
      expect(getCacheGroup).not.toHaveBeenCalled()
    },
  )

  it("processes a complete login cookie change", async () => {
    const { dispatchCookieChange, getPendingSave, getCacheGroup } = await registerCookieListeners()

    await dispatchCookieChange({
      cookie: {
        domain: env.WXT_AUTH_COOKIE_DOMAINS[0],
        name: "better-auth.session_token",
        value: "test-session",
      },
      removed: false,
      cause: "explicit",
    })

    expect(getPendingSave).toHaveBeenCalledOnce()
    expect(getCacheGroup).toHaveBeenCalledWith(AUTH_CACHE_GROUP_KEY)
  })
})
