import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { groupsApi } from '../lib/api'
import { useAuth } from './AuthContext'

const GroupContext = createContext({})

export const useGroup = () => useContext(GroupContext)

export function GroupProvider({ children }) {
  const { user } = useAuth()
  const [currentGroup, setCurrentGroup] = useState(null)

  // Fetch user's groups
  const { data: myGroups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: groupsApi.getMyGroups,
    enabled: !!user,
  })

  // Load saved group from localStorage or select first group
  useEffect(() => {
    if (myGroups?.data?.length > 0 && !currentGroup) {
      const savedGroupId = localStorage.getItem('currentGroupId')
      const savedGroup = myGroups.data.find(g => g.id === savedGroupId)
      setCurrentGroup(savedGroup || myGroups.data[0])
    }
  }, [myGroups, currentGroup])

  // Save current group to localStorage
  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem('currentGroupId', currentGroup.id)
    }
  }, [currentGroup])

  const selectGroup = (group) => {
    setCurrentGroup(group)
  }

  const value = {
    currentGroup,
    groupId: currentGroup?.id,
    myGroups: myGroups?.data || [],
    groupsLoading,
    selectGroup,
    refetchGroups,
    myRole: currentGroup?.my_role,
    isGroupAdmin: currentGroup?.my_role === 'admin',
    isGroupTreasurer: currentGroup?.my_role === 'treasurer',
    canManageGroup: ['admin', 'treasurer'].includes(currentGroup?.my_role),
  }

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  )
}
