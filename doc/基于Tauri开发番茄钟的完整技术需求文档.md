<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## 基于Tauri开发番茄钟的完整技术需求文档

以下是一份结构化的开发需求清单和技术文档链接，专为AI代码生成优化，确保代码简洁高效。

### 一、项目初始化需求

**脚手架命令**

```bash
npm create tauri-app@latest
# 或使用 cargo
cargo create-tauri-app
```

选择配置：前端选择React/Vue/Svelte，语言选TypeScript，包管理器选npm/pnpm[^1][^2]

**官方文档**

- 项目创建指南：https://v2.tauri.app/start/create-project/[^2]
- 开发入门：https://v2.tauri.app/develop/[^3]


### 二、核心功能需求模块

#### 1. **计时器逻辑**（前端实现）

- 25分钟工作时间、5分钟短休息、15分钟长休息倒计时[^4][^5]
- 使用Svelte/React的`derived store`或`useState` + `useEffect`实现每秒递减[^5]
- 倒计时归零时触发后端命令切换阶段[^5]

**关键代码模式**：

```typescript
// 前端监听后端发送的remaining事件
listen('remaining', (event) => {
  setTime(event.payload * 60); // 转换为秒
});
```


#### 2. **阶段管理系统**（Rust后端）

- 定义`TimePhase`枚举：Work、ShortBreak、LongBreak[^5]
- 使用Tauri的Managed State存储当前阶段[^5]
- 实现`switch_phase`命令处理阶段切换逻辑[^5]

**Rust依赖清单**：

```toml
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = "0.4"
tauri-plugin-store = "2.0"
anyhow = "1.0"
```


#### 3. **数据持久化**（tauri-plugin-store）

- 安装：`npm i @tauri-apps/plugin-store`[^5]
- 存储内容：用户设置（工作/休息时长）、统计数据（今日/本周/总计完成数）、上次打开时间[^5]
- Rust端使用`StoreBuilder`初始化默认值[^5]

**官方文档**

- Store插件文档：https://v2.tauri.app/plugin/store/[^5]


#### 4. **系统通知**（Notification API）

- 阶段切换时触发Windows原生通知[^4][^5]
- 前端请求通知权限：`requestPermission()`[^6]
- Rust端发送通知：

```rust
Notification::new(app_id)
  .title("Phase changed")
  .body("Time to work!")
  .show()
```

**官方文档**

- 通知API：https://v2.tauri.app/reference/javascript/notification/[^6]


#### 5. **系统托盘**（System Tray）

- 最小化到托盘，右键菜单提供快捷操作[^7]
- 配置文件：`tauri.conf.json`中启用`systemTray`[^7]

**官方文档**

- 系统托盘教程：https://v2.tauri.app/learn/system-tray/[^7]


#### 6. **统计数据追踪**

- Rust结构体：

```rust
struct Stats {
  today: Stat,   // 今日数据
  week: Stat,    // 本周数据
  total: Stat,   // 总计数据
}
struct Stat {
  minutes: i32,
  sessions: i32,
}
```

- 每次完成工作阶段时更新统计[^5]
- 检测日期/周变化自动重置today/week字段[^5]


### 三、前端UI技术栈

**推荐组合**：

- Tailwind CSS（快速样式编写）[^8][^2]
- DaisyUI（预制美观组件）[^5]
- Radix UI / Shadcn（高级交互组件）[^9]

**安装命令**：

```bash
npm install -D tailwindcss daisyui
npx tailwindcss init
```

**UI组件需求**：

- 圆形进度条显示倒计时[^5]
- 阶段切换按钮（前进/后退）[^5]
- 设置页面（输入框调整时长）[^5]
- 统计报表页（卡片展示数据）[^5]


### 四、前后端通信规范

**Tauri Commands**（Rust → 前端调用）：

```rust
#[tauri::command]
fn switch_phase(app: AppHandle) -> Result<(), String> {
  // 切换逻辑
  app.emit_all("switch-phase", new_phase);
  Ok(())
}
```

**前端调用方式**：

```typescript
import { invoke } from '@tauri-apps/api/tauri';
await invoke('switch_phase', { isPrevious: false });
```

**Event System**（Rust → 前端推送）：

```typescript
import { listen } from '@tauri-apps/api/event';
listen('remaining', (event) => {
  console.log(event.payload); // 接收剩余时间
});
```


### 五、关键技术文档汇总

| 技术模块 | 官方文档链接 | 说明 |
| :-- | :-- | :-- |
| 项目初始化 | https://v2.tauri.app/start/create-project/ | 脚手架使用指南 [^2] |
| Tauri Commands | https://v2.tauri.app/develop/calling-rust/ | 前端调用Rust方法 [^3] |
| Event System | https://v2.tauri.app/develop/inter-process-communication/ | 事件推送机制 [^5] |
| Store插件 | https://v2.tauri.app/plugin/store/ | 数据持久化 [^5] |
| 系统托盘 | https://v2.tauri.app/learn/system-tray/ | 托盘图标配置 [^7] |
| 通知API | https://v2.tauri.app/reference/javascript/notification/ | 系统通知 [^6] |
| 构建打包 | https://v2.tauri.app/distribute/ | 生成安装包 [^5] |

### 六、完整开发流程示例

**参考项目**：

- 番茄钟完整教程：https://cs310.hashnode.dev/how-to-build-a-practical-pomodoro-timer-with-tauri[^4][^5]
- LogRocket教程：https://blog.logrocket.com/build-pomodoro-timer-tauri-using-react-and-vite/[^8]

**项目结构**：

```
project/
├── src/              # 前端代码（React/Vue/Svelte）
│   ├── App.tsx
│   ├── stores.ts     # 状态管理
│   └── components/
├── src-tauri/        # Rust后端代码
│   ├── src/main.rs   # 核心逻辑
│   └── tauri.conf.json
└── package.json
```


### 七、AI编程优化建议

为了让AI生成高质量代码，提供需求时应包含：

1. **明确的类型定义**：所有数据结构的TypeScript/Rust类型[^5]
2. **命令清单**：列出所有需要的Tauri命令名称和参数[^5]
3. **事件列表**：前后端需要监听的事件名称和载荷格式[^5]
4. **依赖版本**：固定Tauri版本为2.0，避免API不兼容[^10]
5. **错误处理**：使用`Result<T, E>`类型，配合`anyhow`库统一错误处理[^5]

按此文档结构提供需求，可以显著提升AI代码生成的准确性和可维护性[^4][^5]
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19]</span>

<div align="center">⁂</div>

[^1]: https://v2.tauri.app/start/create-project/

[^2]: https://blog.csdn.net/gitblog_00868/article/details/155123540

[^3]: https://v2.tauri.app/develop/

[^4]: https://cs310.hashnode.dev/how-to-build-a-practical-pomodoro-timer-with-tauri

[^5]: https://apps.microsoft.com/detail/9nxpdp9gg880?hl=zh-CN

[^6]: https://tauri.app/v1/api/js/notification

[^7]: https://v2.tauri.app/learn/system-tray/

[^8]: https://blog.logrocket.com/build-pomodoro-timer-tauri-using-react-and-vite/

[^9]: https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/

[^10]: https://v2.tauri.app/blog/tauri-20/

[^11]: https://v2.tauri.app/learn/

[^12]: https://v2.tauri.app/start/

[^13]: https://tauri.app/assets/learn/community/HTML_CSS_JavaScript_and_Rust_for_Beginners_A_Guide_to_Application_Development_with_Tauri.pdf

[^14]: https://dev.to/giuliano1993/learn-tauri-by-doing-part-1-introduction-and-structure-1gde

[^15]: https://www.youtube.com/watch?v=k9_4CC0j__c

[^16]: https://www.reddit.com/r/tauri/comments/1meb4m7/feedback_wanted_just_published_a_beginnerfriendly/

[^17]: https://github.com/tauri-apps/tauri-docs/issues/2184

[^18]: https://dev.to/akash2061/my-journey-in-rust-tauri-creating-a-simple-pomodoro-timer-app-ad9

[^19]: https://www.reddit.com/r/electronjs/comments/1hfrenw/my_journey_in_rust_tauri_building_a_simple/

