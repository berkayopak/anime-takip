// ProgressBar Component
// ...progress bar UI will be implemented here...
import PropTypes from 'prop-types';

export default function ProgressBar({ progress = 0, max = 100, error = null }) {
  if (error) {
    return <div className="progress-bar progress-bar-error">Error: {error.toString()}</div>;
  }
  const percent = max > 0 ? Math.min(100, Math.round((progress / max) * 100)) : 0;
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar-label">{percent}%</span>
    </div>
  );
}

ProgressBar.propTypes = {
  progress: PropTypes.number,
  max: PropTypes.number,
  error: PropTypes.any,
};
