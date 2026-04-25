/**
 * Consistent API response envelope.
 *
 *  { success: true,  data: { … }, meta: { … } }
 *  { success: false, error: { message, code } }
 */

const ok = (res, data = null, meta = null, status = 200) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

const fail = (res, message = 'Something went wrong', status = 400, code = 'BAD_REQUEST') => {
  return res.status(status).json({
    success: false,
    error: { message, code },
  });
};

module.exports = { ok, fail };
