// Express response helpers
export function success(res, data, message = 'Success') {
  res.status(200).json({
    success: true,
    data,
    message
  });
}

export function error(res, message, status = 400) {
  console.error(message);
  res.status(status).json({
    success: false,
    error: message
  });
}

// Legacy aliases
export const response = success;
export const ok = success;
export const fail = error;
