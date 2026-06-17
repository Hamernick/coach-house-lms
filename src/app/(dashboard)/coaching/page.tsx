import { CoachingBookingPage } from "@/features/coaching-booking"

type CoachingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CoachingPage({ searchParams }: CoachingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return <CoachingBookingPage searchParams={resolvedSearchParams} />
}
