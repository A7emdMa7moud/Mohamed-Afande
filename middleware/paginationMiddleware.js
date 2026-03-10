const getPaginationOptions = (req, defaults = {}) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || defaults.limit || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const paginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = { getPaginationOptions, paginatedResponse };
