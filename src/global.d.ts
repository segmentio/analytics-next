declare global {
  namespace Express {
    interface Request {
      // Additional properties we add to the express Request object
      requestId: string
    }
  }
}

export {}
