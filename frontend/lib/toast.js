export function showToast(message, options = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: {
        message,
        duration: options.duration,
      },
    })
  );
}
