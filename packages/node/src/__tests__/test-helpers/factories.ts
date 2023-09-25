export const createSuccess = (body?: any) => {
  return Promise.resolve({
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    ok: true,
    status: 200,
    statusText: 'OK',
  }) as Promise<Response>
}

export const createError = (overrides: Partial<Response> = {}) => {
  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    ...overrides,
  }) as Promise<Response>
}
