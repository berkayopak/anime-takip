// TabNavigation Component
// ...tab navigation UI will be implemented here...
import PropTypes from 'prop-types';

export default function TabNavigation({ tabs = [], activeTab, onTabChange, error = null }) {
  if (error) {
    return <div className="tab-navigation tab-navigation-error">Error: {error.toString()}</div>;
  }
  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab}
          className={tab === activeTab ? 'active' : ''}
          onClick={() => onTabChange && onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

TabNavigation.propTypes = {
  tabs: PropTypes.array,
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  error: PropTypes.any,
};
