import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner-large"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
}