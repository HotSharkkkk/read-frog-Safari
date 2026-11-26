# 陪读蛙 Read Frog for Safari

这是 [陪读蛙](https://github.com/mengxi-ream/read-frog) 的 macOS Safari 移植版。陪读蛙提供网页双语翻译和划词翻译等功能。本仓库的 Safari 构建使用 Manifest V3，以 **Safari 18.6 及以上**为兼容目标。

## 构建与临时安装

使用 Node.js 26.13.1 和 pnpm 12.21.0，在仓库根目录运行以下命令。

```sh
pnpm install --frozen-lockfile
WXT_SKIP_ENV_VALIDATION=true pnpm build:safari
```

1. 在 Safari 的「设置 → 高级」中开启「显示网页开发者功能」。
2. 在「设置 → 开发者」中选择「添加临时扩展」，选中构建生成的 `.output/safari-mv3` 目录。
3. 在「设置 → 扩展」中启用陪读蛙，授予要翻译的网站访问权限，然后刷新网页。

临时扩展会在退出 Safari 或经过 24 小时后移除。使用完整 Xcode 可运行 `pnpm package:safari` 生成 macOS 工程。详见 [Safari 安装与打包指南](./readmes/safari.md)。

## Safari 功能差异

- 浮动按钮用于切换网页翻译。Safari 版隐藏侧边栏选项。
- 通过设置中的本地导入和导出备份配置。Safari 版暂不支持 Google Drive 配置同步。
- 网页翻译需要网站访问权限，Safari 版的范围为 HTTP 和 HTTPS 网页。

项目许可见 [LICENSE](./LICENSE)。
