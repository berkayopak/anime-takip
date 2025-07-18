// Modal Component
// ...modal dialog UI will be implemented here...
import PropTypes from 'prop-types';

export default function Modal({ isOpen, content, onClose, error = null }) {
  if (error) {
    return <div className="modal-overlay modal-error">Error: {error.toString()}</div>;
  }
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {content}
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  content: PropTypes.node,
  onClose: PropTypes.func,
  error: PropTypes.any,
};
