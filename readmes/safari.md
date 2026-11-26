# 在 macOS Safari 中使用陪读蛙

Safari 构建以 **Safari 18.6 或更新版本**为兼容目标，使用 Manifest V3。

## 临时安装

1. 打开 Safari 的「设置 → 高级」，勾选「显示网页开发者功能」。
2. 打开「设置 → 开发者」，选择「添加临时扩展」，按 Safari 提示完成认证。
3. 选择构建目录 `.output/safari-mv3`，或选择以 `manifest.json` 为根目录的 Safari 扩展 ZIP。
4. 在「设置 → 扩展」启用陪读蛙，打开要翻译的网页。点按工具栏中的陪读蛙图标，按提示授予该网站的访问权限，再刷新网页。

临时扩展会在退出 Safari 或经过 24 小时后被移除。[Apple 的临时安装说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

## 从源码构建

使用项目 `package.json` 指定的 Node.js 和 pnpm 版本。在仓库根目录执行：

```sh
pnpm install --frozen-lockfile
WXT_SKIP_ENV_VALIDATION=true pnpm build:safari
```

产物位于 `.output/safari-mv3`。这个本地构建命令使用陪读蛙的线上服务默认地址，允许省略发行版的 Google OAuth 和统计配置。

## 生成 macOS Xcode 工程

安装并选用完整的 Xcode 后，在完成 Safari 构建的同一仓库根目录执行：

```sh
pnpm package:safari
```

默认工程目录为 `safari/Read Frog`。脚本也接受两个位置参数，依次为构建目录和工程输出目录。要分发应用，请在 Xcode 中为应用和扩展配置签名，并为你的开发者账号设置唯一的 Bundle ID。生成工程时会复制扩展资源。重新打包时可指定新的工程输出目录。[Apple 的打包说明](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)

## Safari 功能差异

- 浮动按钮执行网页翻译，设置中隐藏侧边栏选项。
- Google Drive 配置备份依赖浏览器的 OAuth 接口。Safari 中可通过设置里的本地导出和导入迁移配置。
- 网页翻译需要网站访问权限。本地 `file://` 页面不在 Safari 构建的支持范围内。
