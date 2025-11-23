import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FilterOptions, User } from '../types'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'

export function useProfileFiltering(filters: FilterOptions) {
  const { user: clerkUser } = useUser()

  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matches, setMatches] = useState<string[]>([])
  const [selectedMatch, setSelectedMatch] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [mutualMatchIds, setMutualMatchIds] = useState<string[]>([])
  const [viewedProfileIds, setViewedProfileIds] = useState<string[]>([])
  const [incomingMatchIds, setIncomingMatchIds] = useState<string[]>([])


  // prevent duplicate load-more requests
  const loadingRef = useRef(false)

  /** ─────────────────────────────
   * Fetch viewed profiles (user has already seen)
   */
  const fetchViewedProfiles = useCallback(async () => {
    if (!clerkUser?.id) return
    try {
      const { data } = await axios.get('/api/view', {
        params: { userId: clerkUser.id },
      })
      if (data?.viewedProfiles) {
        setViewedProfileIds(data.viewedProfiles.map((v: { userBId: string }) => v.userBId))
      }
    } catch (err) {
      console.error('Error fetching viewed profiles:', err)
    }
  }, [clerkUser?.id])

  /** ─────────────────────────────
   * Fetch mutual matches to exclude
   */
  const fetchMutualMatches = useCallback(async () => {
    if (!clerkUser?.id) return
    try {
      const { data } = await axios.get('/api/matches', {
        params: { userId: clerkUser.id, mutual: true },
      })
      if (data?.matches) {
        const ids = data.matches.map((m: { userAId: string; userBId: string }) =>
          m.userAId === clerkUser.id ? m.userBId : m.userAId
        )
        setMutualMatchIds(ids)
      }
    } catch (err) {
      console.error('Error fetching mutual matches:', err)
    }
  }, [clerkUser?.id])

  /** ─────────────────────────────
   * Fetch incoming match requests (they liked you, you haven't liked them back)
   */
  const fetchIncomingMatches = useCallback(async () => {
    if (!clerkUser?.id) return
    try {
      const { data } = await axios.get('/api/matches/incoming', {
        params: { userId: clerkUser.id },
      })
      if (data?.matches) {
        const ids = data.matches.map((m: { userAId: string }) => m.userAId)
        setIncomingMatchIds(ids)
      }
    } catch (err) {
      console.error('Error fetching incoming matches:', err)
    }
  }, [clerkUser?.id])  

  /** ─────────────────────────────
   * Fetch both matches + viewed once per user
   */
  useEffect(() => {
  if (!clerkUser?.id) return
  Promise.all([fetchMutualMatches(), fetchViewedProfiles(), fetchIncomingMatches()])
}, [clerkUser?.id, fetchMutualMatches, fetchViewedProfiles, fetchIncomingMatches])

  /** ─────────────────────────────
   * Stable filter key (stringified params)
   */
  const filterKey = useMemo(() => {
    if (!clerkUser?.id) return ''
    const params = new URLSearchParams({
      userId: clerkUser.id,
      pageSize: '10',
      excludeViewed: 'true',
      experienceMin: filters.experienceRange[0].toString(),
      experienceMax: filters.experienceRange[1].toString(),
      enableLocationBasedMatching: filters.enableLocationBasedMatching.toString(),
    })

    if (filters.skills.length) params.append('skills', filters.skills.join(','))
    if (filters.domains.length) params.append('domains', filters.domains.join(','))
    if (filters.workingStyles.length) params.append('workingStyles', filters.workingStyles.join(','))
    if (filters.collaborationPrefs.length) params.append('collaborationPrefs', filters.collaborationPrefs.join(','))
    if (filters.startupStages?.length) params.append('startupStages', filters.startupStages.join(','))

    if (filters.enableLocationBasedMatching && filters.userCoordinates) {
      params.append('latitude', filters.userCoordinates.latitude.toString())
      params.append('longitude', filters.userCoordinates.longitude.toString())
      params.append('maxDistance', filters.maxDistance?.toString() || '50')
    }

    if (mutualMatchIds.length) params.append('excludeUserIds', mutualMatchIds.join(','))
    if (incomingMatchIds.length) {
      const existing = params.get('excludeUserIds')?.split(',') || []
      params.set('excludeUserIds', [...new Set([...existing, ...incomingMatchIds])].join(','))
    }
    if (viewedProfileIds.length) {
      const existing = params.get('excludeUserIds')?.split(',') || []
      params.set('excludeUserIds', [...new Set([...existing, ...viewedProfileIds])].join(','))
    }

    return params.toString()
  }, [clerkUser?.id, filters, mutualMatchIds, incomingMatchIds, viewedProfileIds])

  /** ─────────────────────────────
   * Fetch users
   */
  const fetchUsers = useCallback(
    async (resetPage = false) => {
      if (!filterKey || !clerkUser?.id) return
      if (loadingRef.current) return // prevent duplicates
      loadingRef.current = true

      const newPage = resetPage ? 1 : page
      setIsLoading(true)
      setError(null)

      try {
        const url = `/api/user?${filterKey}&page=${newPage}`
        const { data } = await axios.get(url, {
          headers: {
            'X-User-ID': clerkUser.id,
            'Cache-Control': 'max-age=300', // 5 min cache
          },
        })

        const filteredData = data.users.filter(
          (u: User) => !mutualMatchIds.includes(u.id) && !viewedProfileIds.includes(u.id)
        )

        if (resetPage) {
          setFilteredUsers(filteredData)
          setCurrentIndex(0)
        } else {
          setFilteredUsers((prev) => [...prev, ...filteredData])
        }

        setPage(newPage + 1)
        setHasMore(data.pagination.page < data.pagination.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error fetching users'))
        console.error('Error fetching users:', err)
      } finally {
        setIsLoading(false)
        loadingRef.current = false
      }
    },
    [clerkUser?.id, filterKey, page, mutualMatchIds, viewedProfileIds]
  )

  /** ─────────────────────────────
   * Initial + filter change fetch
   */
  useEffect(() => {
    if (filterKey) {
      fetchUsers(true)
    }
  }, [filterKey, fetchUsers])

  /** ─────────────────────────────
   * Auto-load more when near end
   */
  useEffect(() => {
    if (currentIndex >= filteredUsers.length - 2 && hasMore && !isLoading) {
      fetchUsers(false)
    }
  }, [currentIndex, filteredUsers.length, hasMore, isLoading, fetchUsers])

  /** ─────────────────────────────
   * Mark profile as viewed
   */
  const markProfileViewed = useCallback(
    async (viewedId: string) => {
      if (!clerkUser?.id) return
      try {
        await axios.post('/api/view', { userId: clerkUser.id, viewedId })
        setViewedProfileIds((prev) => [...prev, viewedId]) // optimistic update
      } catch (err) {
        console.error('Error marking profile as viewed:', err)
      }
    },
    [clerkUser?.id]
  )

  /** ─────────────────────────────
   * Reset viewed profiles
   */
  const resetViewedProfiles = useCallback(async () => {
    if (!clerkUser?.id) return
    setIsLoading(true)
    try {
      setViewedProfileIds([])
      await axios.delete('/api/view', { data: { userId: clerkUser.id } })
      setPage(1)
      setFilteredUsers([])
    } catch (err) {
      console.error('Error resetting viewed profiles:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clerkUser?.id])

  /** ─────────────────────────────
   * Refresh users (e.g. when exhausted)
   */
  const refreshFilteredUsers = useCallback(async () => {
    setFilteredUsers([])
    setIsLoading(true)
    try {
      await Promise.all([fetchMutualMatches(), fetchViewedProfiles()])
      await fetchUsers(true)
    } catch (err) {
      console.error('Error refreshing users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMutualMatches, fetchViewedProfiles, fetchUsers])

  /** ─────────────────────────────
   * Helper: mark current profile as viewed
   */
  const viewCurrentProfile = useCallback(() => {
    if (!filteredUsers[currentIndex]?.id || !clerkUser?.id) return
    markProfileViewed(filteredUsers[currentIndex].id)
  }, [currentIndex, filteredUsers, clerkUser?.id, markProfileViewed])

  /** ─────────────────────────────
   * Exports
   */
  return {
    filteredUsers,
    currentIndex,
    setCurrentIndex,
    matches,
    setMatches,
    selectedMatch,
    setSelectedMatch,
    isLoading,
    error,
    hasMore,
    resetViewedProfiles,
    refreshFilteredUsers,
    viewedProfileIds,
    viewCurrentProfile,
    incomingMatchIds,
    setIncomingMatchIds
  }
}
