/**
 * Decodifica entidades HTML almacenadas como texto plano en la BD.
 * Ej: &quot; → "   &amp; → &   &#39; → '   &lt; → <   &gt; → >
 */
export const decodeHtml = (str) => {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};

export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(value);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDatetime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// DESPUÉS
export const statusColors = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-blue-100 text-blue-800',
  recibida:   'bg-green-100 text-green-800',
  anulada:    'bg-red-100 text-red-700',
  activo:     'bg-green-100 text-green-800',
  inactivo:   'bg-gray-100 text-gray-600',
};
export const roleColors = {
  admin: 'bg-pastel-purple text-purple-800',
  user: 'bg-pastel-primary text-blue-800',
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const paginate = (data, page, perPage = 10) => {
  const start = (page - 1) * perPage;
  return {
    data: data.slice(start, start + perPage),
    total: data.length,
    totalPages: Math.ceil(data.length / perPage),
    currentPage: page,
  };
};

export const filterData = (data, search, fields) => {
  if (!search) return data;
  const lower = search.toLowerCase();
  return data.filter(item =>
    fields.some(field => String(item[field] || '').toLowerCase().includes(lower))
  );
};
