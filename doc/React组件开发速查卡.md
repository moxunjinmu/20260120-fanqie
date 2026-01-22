# React 组件开发速查卡

> 快速参考：最常用的模式和最佳实践

---

## 🎯 组件开发检查清单

### 创建新组件前

- [ ] 确定组件职责是否单一
- [ ] 检查是否可以复用现有组件
- [ ] 设计 Props 接口
- [ ] 确定是否需要内部状态
- [ ] 确定是否需要性能优化

### 组件开发中

- [ ] 使用 TypeScript 定义 Props 类型
- [ ] 添加必要的注释
- [ ] 处理边界情况
- [ ] 考虑可访问性
- [ ] 测试不同状态

### 组件完成后

- [ ] 添加到对应的 index.ts
- [ ] 更新文档
- [ ] 性能测试
- [ ] 代码审查

---

## 📋 常用代码模板

### 1. 基础组件模板

```typescript
import { memo } from "react";

interface ComponentNameProps {
  // Props 定义
  title: string;
  onAction: () => void;
}

export const ComponentName = memo<ComponentNameProps>(({
  title,
  onAction
}) => {
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
});

ComponentName.displayName = "ComponentName";
```

### 2. 带状态的组件模板

```typescript
import { memo, useState, useCallback } from "react";

interface ComponentNameProps {
  initialValue?: string;
  onSubmit: (value: string) => void;
}

export const ComponentName = memo<ComponentNameProps>(({
  initialValue = "",
  onSubmit
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = useCallback(() => {
    onSubmit(value);
  }, [value, onSubmit]);

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
});

ComponentName.displayName = "ComponentName";
```

### 3. 列表项组件模板

```typescript
import { memo } from "react";

interface ItemProps {
  item: ItemType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// ⚠️ 列表项组件必须使用 memo
export const ListItem = memo<ItemProps>(({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  return (
    <div className={isSelected ? "selected" : ""}>
      <h3>{item.title}</h3>
      <button onClick={() => onSelect(item.id)}>选择</button>
      <button onClick={() => onEdit(item.id)}>编辑</button>
      <button onClick={() => onDelete(item.id)}>删除</button>
    </div>
  );
});

ListItem.displayName = "ListItem";
```

### 4. 自定义 Hook 模板

```typescript
import { useCallback, useRef } from "react";

export const useCustomHook = () => {
  const dataRef = useRef<DataType | null>(null);

  const action = useCallback((param: string) => {
    // Hook 逻辑
    console.log(param);
  }, []);

  const reset = useCallback(() => {
    dataRef.current = null;
  }, []);

  return { action, reset };
};
```

---

## 🚀 性能优化速查

### React.memo 何时使用

| 场景 | 是否使用 | 原因 |
|------|----------|------|
| 列表项组件 | ✅ 必须 | 避免整个列表重渲染 |
| 纯展示组件 | ✅ 推荐 | 减少不必要渲染 |
| 复杂计算组件 | ✅ 推荐 | 避免重复计算 |
| 容器组件 | ⚠️ 谨慎 | 通常有频繁变化的 props |
| 最顶层组件 | ❌ 不需要 | 总是需要重渲染 |

### useCallback 何时使用

```typescript
// ✅ 传递给子组件的回调
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

<ChildComponent onClick={handleClick} />

// ✅ 作为 useEffect 的依赖
useEffect(() => {
  handleClick();
}, [handleClick]);

// ❌ 不需要：不传递给子组件
const handleLocalClick = () => {
  console.log("local");
};
```

### useMemo 何时使用

```typescript
// ✅ 复杂计算
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// ✅ 过滤/排序大数组
const filtered = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

// ❌ 不需要：简单计算
const sum = a + b; // 不需要 useMemo
```

---

## 🎨 常用 CSS 类名

### Tailwind 组合

```tsx
// 按钮样式
<button className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glass hover:bg-indigo-700 transition">
  按钮
</button>

// 输入框样式
<input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900" />

// 卡片样式
<div className="mica-panel p-6">
  卡片内容
</div>

// Flex 布局
<div className="flex items-center justify-between gap-4">
  内容
</div>

// Grid 布局
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  内容
</div>
```

---

## 🔧 TypeScript 速查

### 常用类型定义

```typescript
// Props 类型
interface ComponentProps {
  title: string;                    // 必需
  count?: number;                   // 可选
  items: string[];                  // 数组
  status: "idle" | "loading";       // 联合类型
  onUpdate: (id: string) => void;   // 函数
  children?: React.ReactNode;       // 子元素
}

// 继承 HTML 属性
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

// Record 类型
type PhaseConfig = Record<Phase, {
  label: string;
  duration: number;
}>;

// Partial 类型（所有属性可选）
const updateSettings = (updates: Partial<Settings>) => {
  setSettings(prev => ({ ...prev, ...updates }));
};
```

---

## 📁 文件组织规范

### 组件文件结构

```
components/
├── timer/
│   ├── TimerCircle.tsx      # 组件实现
│   ├── TimerControls.tsx
│   └── index.ts             # 统一导出
├── tasks/
│   ├── TaskItem.tsx
│   ├── TaskList.tsx
│   └── index.ts
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    └── index.ts
```

### index.ts 导出模板

```typescript
// components/timer/index.ts
export { TimerCircle } from "./TimerCircle";
export { TimerControls } from "./TimerControls";
export { PhaseSelector } from "./PhaseSelector";

export type { TimerCircleProps } from "./TimerCircle";
export type { TimerControlsProps } from "./TimerControls";
export type { PhaseSelectorProps } from "./PhaseSelector";
```

---

## 🐛 常见问题排查

### 组件不更新

```typescript
// ❌ 问题：直接修改状态
state.items.push(newItem);

// ✅ 解决：创建新对象
setState(prev => ({
  ...prev,
  items: [...prev.items, newItem]
}));
```

### 无限循环渲染

```typescript
// ❌ 问题：useEffect 缺少依赖项
useEffect(() => {
  setCount(count + 1);
}, []); // count 不在依赖数组中

// ✅ 解决：使用函数式更新
useEffect(() => {
  setCount(prev => prev + 1);
}, []);
```

### memo 不生效

```typescript
// ❌ 问题：每次传递新的对象/函数
<Component
  onClick={() => handleClick()}  // 每次都是新函数
  style={{ color: "red" }}        // 每次都是新对象
/>

// ✅ 解决：使用 useCallback 和 useMemo
const handleClick = useCallback(() => {
  doSomething();
}, []);

const style = useMemo(() => ({
  color: "red"
}), []);

<Component onClick={handleClick} style={style} />
```

---

## 📊 调试技巧

### React DevTools

```typescript
// 1. 组件添加 displayName
ComponentName.displayName = "ComponentName";

// 2. 使用 React DevTools Profiler
// - 打开浏览器 React DevTools
// - 切换到 Profiler 标签
// - 点击录制按钮，操作应用
// - 查看哪些组件重渲染了

// 3. 查看 Props 变化
// - 在 DevTools 中选中组件
// - 查看 Props 标签
// - 观察 Props 变化
```

### 性能监控

```typescript
// 测量渲染时间
const startTime = performance.now();
// 组件渲染
const endTime = performance.now();
console.log(`Render time: ${endTime - startTime}ms`);

// 使用 console.count 追踪渲染次数
console.count("ComponentName render");
```

---

## 🎓 最佳实践提醒

1. **组件大小**: 保持在 150 行以内
2. **Props 数量**: 不超过 7 个
3. **嵌套层级**: 不超过 4 层
4. **文件长度**: 单文件不超过 300 行
5. **命名规范**: PascalCase 组件，camelCase 函数
6. **导入顺序**: React → 第三方库 → 本地组件 → 类型 → 样式

---

**版本**: 1.0
**最后更新**: 2026-01-22
