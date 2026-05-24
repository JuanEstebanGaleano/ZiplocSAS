export function parseApiError(err) {
  if (!err) return { message: 'Unknown error', status: null };
  const isConnectionError = !!err.isConnectionError || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || !err.response;
  const status = err.status || err.response?.status || null;
  const data = err.data || err.response?.data || null;
  const message = err.message || data?.message || 'Error comunicándose con el servidor';
  return { message, status, data, isConnectionError };
}
