// SearchBox Component
// ...search input and logic will be implemented here...
import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let debounceTimeout = null;

  const handleChange = (e) => {
    setQuery(e.target.value);
    setError(null);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      handleSearch();
    }, 400);
  };

  const handleSearch = async () => {
    if (!onSearch) return;
    setLoading(true);
    try {
      await onSearch(query);
      setError(null);
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  return (
    <div className="search-box">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search anime..."
        disabled={loading}
      />
      <button onClick={handleSearch} disabled={loading}>Search</button>
      {loading && <span className="search-loading">Searching...</span>}
      {error && <span className="search-error">Error: {error.toString()}</span>}
    </div>
  );
}

SearchBox.propTypes = {
  onSearch: PropTypes.func,
};
