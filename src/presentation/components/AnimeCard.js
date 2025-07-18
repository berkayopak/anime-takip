// AnimeCard Component
// ...anime-themed card UI will be implemented here...
import PropTypes from 'prop-types';
import '../../renderer/components/AnimeCard.css';

export default function AnimeCard({ anime, onSelect, loading = false, error = null }) {
  if (loading) {
    return <div className="anime-card anime-card-loading">Loading...</div>;
  }
  if (error) {
    return <div className="anime-card anime-card-error">Error: {error.toString()}</div>;
  }
  if (!anime) return null;
  return (
    <div className="anime-card" onClick={() => onSelect && onSelect(anime)}>
      <img src={anime.cover || ''} alt={anime.title} className="anime-card-cover" />
      <div className="anime-card-info">
        <h3>{anime.title}</h3>
        <p>{anime.description}</p>
      </div>
    </div>
  );
}

AnimeCard.propTypes = {
  anime: PropTypes.object,
  onSelect: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.any,
};
