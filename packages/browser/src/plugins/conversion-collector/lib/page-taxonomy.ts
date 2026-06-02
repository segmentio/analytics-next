export type PathTaxonomy = {
  country: string
  vertical: string
  product: string
  funnel: string
}

const EMPTY_TAXONOMY: PathTaxonomy = {
  country: '',
  vertical: '',
  product: '',
  funnel: '',
}

export function parsePathTaxonomy(pathname: string): PathTaxonomy {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '')
  const firstSegment = trimmed.split('/')[0] ?? ''
  if (!firstSegment) {
    return { ...EMPTY_TAXONOMY }
  }

  const parts = firstSegment.split('-')
  if (parts.length < 4) {
    return { ...EMPTY_TAXONOMY }
  }

  if (parts.length === 4) {
    return {
      country: parts[0] ?? '',
      vertical: parts[1] ?? '',
      product: parts[2] ?? '',
      funnel: parts[3] ?? '',
    }
  }

  return {
    country: parts[0] ?? '',
    vertical: parts[1] ?? '',
    product: parts.slice(2, -1).join('-'),
    funnel: parts[parts.length - 1] ?? '',
  }
}

export function getPagePath(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.pathname || ''
}
