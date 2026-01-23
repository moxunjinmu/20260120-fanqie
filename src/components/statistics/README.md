# Statistics Components

This directory contains all the components for the statistics and trends feature.

## Components

### StatisticsPage
The main page component that displays statistics trends and history.

**Props:**
- `history: StatsHistory` - The history data from the app state

**Usage:**
```tsx
import { StatisticsPage } from './components/statistics';

// In your App component
const [history, setHistory] = useState<StatsHistory>({});

// Render the statistics page
<StatisticsPage history={history} />
```

### TimeRangeSelector
A button group for selecting time ranges (7 days, 30 days, all).

**Props:**
- `selected: TimeRange` - Currently selected time range
- `onChange: (range: TimeRange) => void` - Callback when selection changes

### TrendChart
A bar chart showing focus minutes and completed pomodoros over time.

**Props:**
- `data: ChartDataPoint[]` - Array of data points to display

### HistoryList
A list showing historical data in reverse chronological order.

**Props:**
- `data: ChartDataPoint[]` - Array of data points to display

### HistoryListItem
A single item in the history list.

**Props:**
- `data: ChartDataPoint` - The data point to display

### EmptyState
A component to display when there's no data.

**Props:**
- `message: string` - The message to display

## Integration Example

To integrate the statistics page into your app:

1. **Add a new view mode** in `src/types/index.ts`:
```typescript
export type ViewMode = "main" | "settings" | "statistics";
```

2. **Add navigation** in your App component:
```tsx
import { StatisticsPage } from './components/statistics';

// In your App component
const [viewMode, setViewMode] = useState<ViewMode>("main");

// Add a button to navigate to statistics
<button onClick={() => setViewMode("statistics")}>
  统计
</button>

// Render the statistics page when viewMode is "statistics"
{viewMode === "statistics" && (
  <StatisticsPage history={history} />
)}
```

3. **Add a back button** in StatisticsPage or create a navigation bar.

## Styling

All components follow the Windows 11 Mica glass effect design:
- Glass panels with `bg-white/5` and `hover:bg-white/10`
- Smooth transitions with `transition-colors duration-200`
- Cursor pointer on interactive elements
- Consistent spacing and typography

## Testing

All components have comprehensive unit tests. Run tests with:

```bash
npm test -- src/components/statistics
```

## Dependencies

- **recharts**: For chart visualization
- **@testing-library/react**: For component testing
- **@testing-library/user-event**: For user interaction testing
