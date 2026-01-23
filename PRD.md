# 番茄钟 PRD（Tauri）

## 迭代记录

### Step 1（2026-01-21）

已完成需求：
- 计时器核心：工作/短休/长休阶段倒计时，开始/暂停/重置/跳过
- 阶段切换逻辑：长休间隔计算 + 手动阶段切换按钮
- 自动/手动流转：默认不自动开始下一阶段 + 可配置开关
- 通知与提示音：阶段完成通知 + 结束提示音
- 白噪音基础：雨声/咖啡馆/篝火三种类型
- 本地持久化：Store 插件（Tauri）+ localStorage 兜底
- 今日概览统计：完成专注分钟数/番茄数
- 基础 UI：圆形进度条 + 设置面板（时长/偏好）

### Step 2（2026-01-22）

已完成需求：
- 任务管理：新增/编辑/删除任务、预估番茄数
- 任务列表：待办/已完成视图切换
- 任务操作：选择当前任务、快捷编辑、删除
- 任务完成：番茄完成后自动更新任务进度
- 页面重构：主界面简化（番茄钟核心 + 简单计时设置）
- 设置页面：独立设置页（计时设置 + 偏好设置 + 其他设置）
- 任务绑定：计时器与任务关联，实时显示任务进度

### Step 3（2026-01-22）

已完成需求：

- 通用 UI 组件库：Button、Input、Modal、Panel 组件
- Button 组件：支持 4 种 variant (primary, secondary, outline, small)
- Input 组件：支持 2 种 variant (default, full)
- Modal 组件：支持 backdrop blur 效果、ESC 键关闭
- Panel 组件：统一使用 mica-panel 样式
- 所有组件均使用 React.memo 优化性能
- 统一导出：通过 src/components/ui/index.ts 导出

### Step 4（2026-01-22）

已完成需求：

- 计时器组件拆分：从 App.tsx 拆分计时器相关组件到 src/components/timer/
- TimerCircle 组件：圆形进度条 SVG，使用 TIMER_RADIUS 和 TIMER_CIRCUMFERENCE 常量
- TimerControls 组件：开始/暂停/重置/跳过按钮组，使用 useCallback 优化
- PhaseSelector 组件：工作/短休息/长休息阶段选择器
- 所有计时器组件均使用 React.memo 优化性能
- 统一导出：通过 src/components/timer/index.ts 导出
- App.tsx 重构：使用新的计时器组件，代码更简洁易维护

### Step 5（2026-01-22）

已完成需求：

- 统计组件拆分：从 App.tsx 拆分统计相关组件到 src/components/stats/
- CurrentTaskDisplay 组件：显示当前任务标题、进度（completedPomodoros/estPomodoros）、切换按钮
- TodayStats 组件：显示今日专注分钟数和完成番茄数
- 统一导出：通过 src/components/stats/index.ts 导出
- 设置组件拆分：从 App.tsx 拆分设置相关组件到 src/components/settings/
- TimerSettings 组件：计时设置表单（专注/短休/长休时长、长休间隔），可在主视图和设置视图复用
- PreferenceSettings 组件：偏好设置（自动开始、提示音、白噪音开关及类型）
- OtherSettings 组件：其他设置（迷你模式、最小化到托盘）
- 统一导出：通过 src/components/settings/index.ts 导出
- 所有组件均使用 React.memo 优化性能，添加 Props 类型定义
- App.tsx 重构：使用新的统计和设置组件，提升代码可维护性和可读性

### Step 6（2026-01-22）- 项目重构与性能优化

已完成需求：

**架构重构：**

- 创建清晰的目录结构：components/、hooks/、constants/、types/、lib/
- 常量提取：timer.ts、ui.ts、audio.ts 统一管理常量
- 类型拆分：timer.ts、task.ts、settings.ts、stats.ts 按功能域拆分
- 工具函数：timer.ts（phaseMinutes、getNextPhase）、stats.ts（getDefaultDailyStat）
- Hooks 提取：useNotification、useWhiteNoise、useChime 独立为可复用 hooks

**组件化重构：**

- 通用 UI 组件：Button、Input、Modal、Panel（4个基础组件）
- 计时器组件：TimerCircle、TimerControls、PhaseSelector（3个组件）
- 任务管理组件：TaskFilter、TaskItem、TaskForm、TaskList（4个组件）
- 设置组件：TimerSettings、PreferenceSettings、OtherSettings（3个组件）
- 统计组件：CurrentTaskDisplay、TodayStats（2个组件）
- 总计：16个可复用组件，所有组件均使用 React.memo 优化

**UI/UX 优化：**

- 设置页面布局重构：从竖向长条改为横向分栏布局（左侧导航 + 右侧内容）
- 左侧导航：3个设置分类（计时设置⏱、偏好设置🎨、其他设置⚙️）
- Tab 切换：点击导航项切换右侧内容区，保持 Mica 玻璃效果
- 更适合桌面应用：横向布局充分利用屏幕空间，视觉层次更清晰

**性能优化：**

- React.memo：所有组件使用 memo 防止不必要的重渲染
- useCallback：事件处理函数使用 callback 保持引用稳定
- useMemo：TaskList 中的 filteredTasks 和 sortedTasks 使用 memo 缓存
- 关键优化：TaskItem 使用 memo 避免整个列表重渲染

**代码质量提升：**

- App.tsx 从 1077 行减少到约 650 行（减少 40%）
- 职责分离：每个组件单一职责，易于理解和维护
- DRY 原则：TimerSettings 组件在主视图和设置视图中复用
- TypeScript：所有组件完整的类型定义和 Props 接口
- 构建验证：项目成功构建，无 TypeScript 错误

**项目结构：**

```text
src/
├── components/
│   ├── timer/          # 计时器组件（3个）
│   ├── tasks/          # 任务管理组件（4个）
│   ├── settings/       # 设置组件（3个）
│   ├── stats/          # 统计组件（2个）
│   └── ui/             # 通用UI组件（4个）
├── hooks/              # 自定义Hooks（3个）
├── constants/          # 常量定义（3个文件）
├── types/              # 类型定义（5个文件）
├── lib/                # 工具函数（4个文件）
└── App.tsx             # 主应用（简化后）
```

后续待办（非下一步）：
- 迷你悬浮窗（Mini Mode）
- 系统托盘与快捷菜单
- 开机自启 + 最小化启动
- Windows 专注助手（DND）联动

### Step 7（2026-01-22）- 统计趋势图与历史记录

已完成需求：

**数据处理层：**

- 类型定义：TimeRange 类型（7天/30天/全部）、ChartDataPoint 接口
- 日期工具函数：calculateStartDate、generateDateRange、formatDate（今天/昨天/日期）
- 数据验证：validateAndCleanHistory（处理格式错误、缺失字段）
- 数据处理：processHistoryData（时间范围过滤、零值填充、排序）
- 聚合计算：calculateTotals（总专注分钟数、总完成番茄数）
- 单元测试：16个测试全部通过，覆盖所有数据处理函数

**统计组件：**

- EmptyState 组件：空状态提示，使用 SVG 图标（非 emoji）
- TimeRangeSelector 组件：三个时间范围按钮（7天/30天/全部）
- HistoryListItem 组件：单个历史记录项，显示日期、分钟数、番茄数
- HistoryList 组件：历史记录列表，倒序排列，使用 useMemo 优化
- TrendChart 组件：Recharts 柱状图，双 Y 轴，indigo/emerald 配色
- StatisticsPage 组件：主统计页面，集成所有子组件
- StatisticsErrorBoundary 组件：错误边界，友好的错误提示和重试功能
- 总计：7个新组件，所有组件均使用 React.memo 优化

**应用集成：**

- ViewMode 类型：添加 "statistics" 视图模式
- 导航按钮：主界面添加"统计"按钮，与设置按钮并列
- 统计视图：全屏统计页面，包含返回按钮
- 错误处理：使用 StatisticsErrorBoundary 包装 StatisticsPage
- 数据绑定：从 App.tsx 传递 history 状态到 StatisticsPage

**UI/UX 设计：**

- Windows 11 Mica 玻璃效果：所有组件使用 mica-panel 样式
- 配色一致性：使用 indigo-400/emerald-400 匹配应用主题
- 交互反馈：所有可交互元素添加 hover 效果和 cursor-pointer
- 平滑过渡：使用 transition-colors duration-200
- 响应式布局：使用 flex、gap、space-y 等实现自适应

**测试与验证：**

- 单元测试：47个测试全部通过（100% 通过率）
- 组件测试：EmptyState、TimeRangeSelector、HistoryListItem、HistoryList、TrendChart、StatisticsPage
- 数据处理测试：所有工具函数的单元测试
- TypeScript 编译：无错误
- 生产构建：成功构建

**依赖安装：**

- recharts: ^3.7.0（图表渲染库）
- fast-check: ^4.5.3（属性测试库，用于未来的 PBT）
- vitest: ^4.0.17（测试框架，已配置）

**项目结构更新：**

```text
src/
├── components/
│   ├── statistics/     # 统计组件（7个新组件）
│   │   ├── EmptyState.tsx
│   │   ├── TimeRangeSelector.tsx
│   │   ├── HistoryListItem.tsx
│   │   ├── HistoryList.tsx
│   │   ├── TrendChart.tsx
│   │   ├── StatisticsPage.tsx
│   │   ├── StatisticsErrorBoundary.tsx
│   │   └── index.ts
│   ├── timer/          # 计时器组件（3个）
│   ├── tasks/          # 任务管理组件（4个）
│   ├── settings/       # 设置组件（3个）
│   ├── stats/          # 统计组件（2个）
│   └── ui/             # 通用UI组件（4个）
├── lib/
│   ├── statistics.ts   # 统计数据处理函数
│   └── ...
├── types/
│   ├── statistics.ts   # 统计类型定义
│   └── ...
└── App.tsx             # 主应用（集成统计视图）
```

后续待办：
- 迷你悬浮窗（Mini Mode）
- 系统托盘与快捷菜单
- 开机自启 + 最小化启动
- Windows 专注助手（DND）联动
