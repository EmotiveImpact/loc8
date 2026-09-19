declare module '*.jsx' {
  import type { ComponentType, ReactNode } from 'react';

  export const App: ComponentType<{
    onOpenTool?: (workspace: string) => void;
    commandState?: Record<string, unknown> | null;
    commandActions?: Record<string, (...args: any[]) => unknown>;
    renderWorkspace?: (args: {
      workspace: any;
      onClose: () => void;
      onNavigate: (workspace: any) => void;
    }) => ReactNode;
  }>;
}
