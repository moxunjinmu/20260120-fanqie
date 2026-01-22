# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（运行 Tauri 开发服务器）
npm run tauri dev

# 生产环境构建
npm run build

# 构建 Tauri 应用
npm run tauri build
```

## 项目概述

基于 Tauri 2.0 的桌面番茄钟应用，使用 React 19 + TypeScript + Tailwind CSS 开发。

### 已完成功能（Step 1）
- 计时器（工作/短休息/长休息三个阶段）
- 圆形进度条界面
- 阶段切换（每 4 个工作阶段后进入长休息）
- 系统通知和提示音
- 白噪音生成器（雨声/咖啡馆/篝火）使用 Web Audio API
- 本地持久化（通过 Tauri Store 插件，localStorage 作为备选）
- 今日统计（专注分钟数、完成番茄数）
- 设置面板（时长和偏好设置）

### 计划功能（Step 2）
- 任务管理（新增/编辑/完成/删除，含番茄数估算）
- 当前任务选择与计时器绑定
- 待办和已完成任务视图

### 未来功能
- 统计图表（7/30 天趋势）
- 迷你模式（悬浮小窗口）
- 系统托盘集成
- Windows 专注助手（DND）集成

## 架构

### 状态管理

所有应用状态都在 `src/App.tsx` 中使用 React hooks 管理。状态通过 Tauri Store 插件持久化到 `pomodoro-store.json`。

**关键状态属性：**
| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `tasks` | `Task[]` | 任务对象数组（已定义但 UI 未实现） |
| `currentTaskId` | `string \| null` | 当前选择的任务 ID |
| `settings` | `Settings` | 用户偏好设置（时长、声音等） |
| `history` | `StatsHistory` | 按日期字符串（`YYYY-MM-DD`）索引的每日统计 |
| `phase` | `Phase` | 当前计时器阶段：`work` / `shortBreak` / `longBreak` |
| `remainingSeconds` | `number` | 当前阶段剩余时间 |
| `status` | `TimerStatus` | `idle` / `running` / `paused` |
| `workSessionsSinceLongBreak` | `number` | 长休息间隔计数器 |

### 持久化

`src/lib/store.ts` 处理持久化：
- Tauri 环境：使用 `@tauri-apps/plugin-store` 进行 JSON 文件存储
- 备选方案：使用 `localStorage` 用于浏览器开发/测试
- 状态变化时自动保存，300ms 防抖
- 应用挂载时进行数据恢复

### 自定义 Hooks

**`useNotification()`** - 系统通知封装，使用 `@tauri-apps/plugin-notification` 检查/请求权限。

**`useWhiteNoise()`** - Web Audio API 实现：
- 生成过滤后的白噪音（雨声/咖啡馆/篝火模式通过低通滤波器频率区分）
- 根据 `whiteNoiseEnabled` 设置、`phase === "work"` 和 `status === "running"` 启动/停止

**`useChime()`** - 阶段完成时播放悦耳的三音琶音（C5、E5、G5）使用 Web Audio 振荡器。

### 类型定义

`src/types.ts` 定义了所有共享类型，包括 `Task`、`Settings`、`DailyStat` 和完整的 `AppStateSnapshot`。

### 工具函数

- `src/lib/time.ts` - 时间格式化、日期键生成（`YYYY-MM-DD`）
- `src/lib/tauri.ts` - `isTauri()` 运行时检测

## UI/UX 说明

- 样式采用 Windows 11 风格的 "Mica" 玻璃效果，使用 `.mica-panel` 类
- Tailwind CSS 配置在 `tailwind.config.ts` 中自定义扩展
- 圆形进度环使用 SVG，`strokeDashoffset` 根据 `remainingSeconds / totalSeconds` 计算
- 进度环通过 `<defs><linearGradient id="timerGradient">` 应用渐变

## Tauri 后端

`src-tauri/src/lib.rs` 目前最小化，仅有一个占位符的 `greet` 命令。所有计时器逻辑在客户端。未来的原生集成（系统托盘、Windows DND）将在此处添加。

## 重要设计决策

1. **默认自动开始为关闭** - 按产品需求，阶段转换时发送通知但不自动开始，防止用户离开时计时器空转。用户可在设置中开启。

2. **Task 类型已定义但 UI 未实现** - `Task` 接口存在于类型定义中且状态已持久化，但没有任务列表组件。主面板的当前任务显示显示 "未选择任务（下一步加入任务管理）" 占位符。

3. **白噪音仅在工作阶段播放** - `useWhiteNoise` hook 确保当计时器暂停、处于休息阶段或设置中禁用噪音时，白噪音自动停止。


## 特殊行为 / 边界条件 / 警告

- 每次在写代码之前，先索引项目里面有没有可以复用的模块，或者可以抽象的相似代码，优先复用，保持DRY原则，不要写重复代码。
- 每完成一阶段任务，就更新一次PRD.md文档
