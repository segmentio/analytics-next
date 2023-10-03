import type { TokenManagerConstructor } from './types'

type Contract = {
  TokenManager: TokenManagerConstructor
}

class DependencyInjection {
  private dependencies = new Map<keyof Contract, any>()

  registerDependency<DependencyName extends keyof Contract>(
    name: DependencyName,
    dependency: Contract[DependencyName]
  ) {
    this.dependencies.set(name, dependency)
  }

  get<DependencyName extends keyof Contract>(
    name: DependencyName
  ): Contract[DependencyName] {
    return this.dependencies.get(name)
  }
}

export const dependencyInjection = new DependencyInjection()
