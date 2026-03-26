type Profile = {
  id: string
  created_at: string
  name: string
  archetype: string
}

type Props = {
  profile: Profile
}

export default function ProfileCard({ profile }: Props) {
  const formattedDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="mb-2 font-cinzel text-[10px] uppercase tracking-[0.2em] text-white/35">
        Profile
      </div>

      <div className="text-2xl italic text-white/90">{profile.name}</div>

      <div className="mt-1 text-[#9590ec]">{profile.archetype}</div>

      <div className="mt-4 text-xs uppercase tracking-[0.15em] text-white/30">
        {formattedDate}
      </div>
    </div>
  )
}