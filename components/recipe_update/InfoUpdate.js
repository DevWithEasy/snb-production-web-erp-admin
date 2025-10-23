import './InfoUpdate.css';

export default function InfoUpdate({ infos, handleInfoChange }) {
  if (!infos) return null;
  
  const filterKeys = Object.keys(infos);

  return (
    <div className="info-update-container">
      <h3 className="info-title">Update Product Information</h3>
      {filterKeys.map((key) => (
        <div key={key} className="info-row">
          <label className="info-label">
            {key.replace(/_/g, " ")}
          </label>
          <input
            type="text"
            className="info-input"
            value={infos[key]?.toString() || ''}
            onChange={(e) => {
              handleInfoChange(key, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}