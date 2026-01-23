import { Component, type ReactNode } from 'react';

interface StatisticsErrorBoundaryProps {
  children: ReactNode;
}

interface StatisticsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StatisticsErrorBoundary extends Component<
  StatisticsErrorBoundaryProps,
  StatisticsErrorBoundaryState
> {
  constructor(props: StatisticsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StatisticsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Statistics component error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
          <div className="mb-4 text-6xl">📊</div>
          <h2 className="mb-2 text-xl font-semibold text-white">统计数据加载失败</h2>
          <p className="mb-6 text-center text-sm text-slate-300">
            抱歉，统计图表遇到了问题。请尝试刷新页面或稍后再试。
          </p>
          {this.state.error && (
            <p className="mb-6 max-w-md text-center text-xs text-slate-400">
              错误信息: {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
