import { currentUser } from '@clerk/nextjs/server'

export default async function Home() {
  const user = await currentUser()

  if (!user) return <div>Not signed in</div>

  return <div>Hello {user?.id}</div>
}