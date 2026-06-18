import { redirect } from 'next/navigation'

// /discovery on its own has no surface — bookmarks land here and are sent to
// the welcome scene. Keeps the namespace's permanent URL useful.
export default function DiscoveryRoot() {
  redirect('/discovery/welcome')
}
