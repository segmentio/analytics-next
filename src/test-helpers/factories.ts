export const createSuccess = (body: any) => {
  return Promise.resolve({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
  }) as Promise<Response>
}
