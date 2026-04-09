import { createSignal, onCleanup, Show } from "solid-js";

type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export default function Notification(props: NotificationProps) {
  const [visible, setVisible] = createSignal(true);
  const duration = props.duration || 3000;

  const close = () => {
    setVisible(false);
    setTimeout(() => {
      props.onClose?.();
    }, 300);
  };

  // Auto-close after duration
  const timeout = setTimeout(close, duration);
  onCleanup(() => clearTimeout(timeout));

  const bgColor = () => {
    switch (props.type) {
      case "success": return "bg-green-500 dark:bg-green-600";
      case "error": return "bg-red-500 dark:bg-red-600";
      case "info": return "bg-blue-500 dark:bg-blue-600";
      default: return "bg-gray-500 dark:bg-gray-600";
    }
  };

  const textColor = () => {
    switch (props.type) {
      case "success": return "text-green-100";
      case "error": return "text-red-100";
      case "info": return "text-blue-100";
      default: return "text-gray-100";
    }
  };

  return (
    <Show when={visible()}>
      <div class="fixed top-4 right-4 z-50 animate-slide-in">
        <div class={`${bgColor()} ${textColor()} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] max-w-md`}>
          <span class="flex-1">{props.message}</span>
          <button
            onClick={close}
            class="ml-4 text-current hover:opacity-80 focus:outline-none"
            aria-label="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Show>
  );
}