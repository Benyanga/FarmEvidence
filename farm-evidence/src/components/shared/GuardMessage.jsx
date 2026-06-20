export function GuardMessage({ message, type = "warning" }) {
  const styles =
    type === "error"
      ? "border-red-300 bg-red-50 text-red-700"
      : type === "success"
        ? "border-green-300 bg-green-50 text-green-700"
        : "border-amber-300 bg-amber-50 text-amber-700";
  return <div className={`card body-sm ${styles}`}>{message}</div>;
}

