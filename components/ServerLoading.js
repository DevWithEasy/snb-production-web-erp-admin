export default function ServerLoading({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="server-loading-overlay">
      <div className="server-loading-container">
        <div className="server-loading-spinner"></div>
        <div className="server-loading-text">Please Wait</div>
        {message && (
          <div className="server-loading-message">{message}</div>
        )}
      </div>
    </div>
  );
}