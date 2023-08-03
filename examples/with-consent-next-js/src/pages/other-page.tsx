import Link from 'next/link'
import { useRouter } from 'next/router'

export default function OtherPage() {
  const {
    query: { writeKey },
  } = useRouter()
  return (
    <main>
      <h1>Other Page</h1>
      <ul>
        <li>
          <Link href={`/?writeKey=${writeKey}`}>Home</Link>
        </li>
      </ul>
    </main>
  )
}
