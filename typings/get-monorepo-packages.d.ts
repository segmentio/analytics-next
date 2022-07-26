declare module 'get-monorepo-packages' {
  export default function getPackages(pathToRoot: string): {
    location: string
    package: {
      name: string
      version: string
    }
  }[]
}
