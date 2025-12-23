import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Users, MapPin, Check, Clock } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useGroup } from '../../context/GroupContext'
import { groupsApi } from '../../lib/api'

export default function Groups() {
  const { myGroups, currentGroup, selectGroup, groupsLoading } = useGroup()

  const { data: pendingGroups } = useQuery({
    queryKey: ['my-pending-groups'],
    queryFn: async () => {
      const { data, error } = await groupsApi.getAll()
      // Filter to show user's pending groups
      return { data: data?.filter(g => g.status === 'pending'), error }
    },
  })

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 mt-1">Manage your village banking groups</p>
        </div>
        <Link to="/dashboard/groups/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Group
          </Button>
        </Link>
      </div>

      {/* Current group indicator */}
      {currentGroup && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-primary-600 font-medium">Currently Active</p>
                  <p className="font-semibold text-gray-900">{currentGroup.name}</p>
                </div>
              </div>
              <Badge variant="primary">{currentGroup.my_role}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Groups */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Groups</h2>
        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentGroup?.id === group.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => selectGroup(group)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-600" />
                      </div>
                      {currentGroup?.id === group.id && (
                        <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                    {group.location && (
                      <p className="text-sm text-gray-500 flex items-center mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {group.location}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-sm text-gray-500">
                        {group.member_count || 0} members
                      </span>
                      <Badge variant={group.my_role === 'admin' ? 'primary' : 'default'}>
                        {group.my_role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Groups</h3>
              <p className="text-gray-500 mb-4">
                You're not a member of any active groups yet. Create a new group or wait for an invitation.
              </p>
              <Link to="/dashboard/groups/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Groups */}
      {pendingGroups?.data?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approval</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingGroups.data.map((group) => (
              <Card key={group.id} className="opacity-75">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                  {group.location && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {group.location}
                    </p>
                  )}
                  <p className="text-sm text-yellow-600 mt-3">
                    Awaiting super admin approval
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
