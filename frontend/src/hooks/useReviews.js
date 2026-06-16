import { useState, useEffect, useCallback } from 'react';
import { fetchReviews, createReview, updateReview, deleteReview } from '../services/api';

export function useReviews(watchId) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReviews = useCallback(() => {
    if (!watchId) return;
    let cancelled = false;
    setLoading(true);
    fetchReviews(watchId)
      .then(data => {
        if (!cancelled) {
          // La respuesta puede venir como { data, averageRating, totalReviews } o directamente un array
          if (data && Array.isArray(data.data)) {
            setReviews(data.data);
            setAverageRating(data.averageRating || 0);
            setTotalReviews(data.totalReviews || 0);
          } else if (Array.isArray(data)) {
            setReviews(data);
            setAverageRating(0);
            setTotalReviews(data.length);
          } else {
            setReviews([]);
            setAverageRating(0);
            setTotalReviews(0);
          }
        }
      })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [watchId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const cleanup = loadReviews();
    return cleanup;
  }, [loadReviews]);

  const addReview = async (data) => {
    const result = await createReview(data);
    await loadReviews();
    return result;
  };

  const editReview = async (id, data) => {
    const result = await updateReview(id, data);
    await loadReviews();
    return result;
  };

  const removeReview = async (id) => {
    await deleteReview(id);
    await loadReviews();
  };

  return { reviews, averageRating, totalReviews, loading, error, addReview, editReview, removeReview, refresh: loadReviews };
}
