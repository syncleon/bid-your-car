import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import "./ToastContainer.css";

export const ToastContainer = observer(() => {
    const { toastStore } = useStore();

    if (!toastStore.toasts.length) return null;

    return (
        <div className="toast-container">
            {toastStore.toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type} glass-panel`}>
                    <div className="toast-icon">
                        {toast.type === "success" && "✓"}
                        {toast.type === "error" && "✗"}
                        {toast.type === "warning" && "!"}
                        {toast.type === "info" && "i"}
                    </div>
                    <div className="toast-content">{toast.message}</div>
                    <button 
                        className="toast-close" 
                        onClick={() => toastStore.removeToast(toast.id)}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
});
