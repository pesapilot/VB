import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Users, Check, X, Clock, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { groupsApi, profilesApi } from '../../lib/api'
import { format } from 'date-fns'

export default function AdminPanel() {
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  const queryClient = useQueryClient()

  // Check if current user is super admin
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['current-profile'],
    queryFn: profilesApi.getCurrent,
  })

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['pending-group-requests'],
    queryFn: groupsApi.getPendingRequests,
    enabled: profile?.data?.platform_role === 'super_admin',
  })

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: profilesApi.getAll,
    enabled: profile?.data?.platform_role === 'super_admin',
  })

  const approveMutation = useMutation({
    mutationFn: ({ requestId }) => groupsApi.approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-group-requests'])
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, notes }) => groupsApi.rejectRequest(requestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-group-requests'])
      setIsRejectModalOpen(false)
      setRejectNotes('')
      setSelectedRequest(null)
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => profilesApi.update(userId, { platform_role: role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-profiles'])
    }
  })

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (profile?.data?.platform_role !== 'super_admin') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You don't have permission to access the admin panel. 
          Only super administrators can view this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Shield className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-gray-500">Manage platform-wide settings and approvals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Requests</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pendingRequests?.data?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-blue-600">
              {allProfiles?.data?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Super Admins</p>
            <p className="text-2xl font-bold text-purple-600">
              {allProfiles?.data?.filter(p => p.platform_role === 'super_admin').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Group Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-500" />
            Pending Group Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requestsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : pendingRequests?.data?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{request.groups?.name}</p>
                          <p className="text-sm text-gray-500">{request.groups?.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{request.profiles?.full_name}</p>
                      <p className="text-sm text-gray-500">{request.profiles?.email}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ requestId: request.id })}
                          loading={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsRejectModalOpen(true)
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No pending group requests
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allProfiles?.data?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Platform Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProfiles.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.platform_role === 'super_admin' ? 'primary' : 'default'}>
                        {user.platform_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.platform_role !== 'super_admin' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.id, 
                            role: 'super_admin' 
                          })}
                        >
                          Make Super Admin
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)}>
        <ModalHeader onClose={() => setIsRejectModalOpen(false)}>
          Reject Group Request
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-600 mb-4">
            Are you sure you want to reject the group "{selectedRequest?.groups?.name}"?
          </p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows={3}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => rejectMutation.mutate({ 
              requestId: selectedRequest?.id, 
              notes: rejectNotes 
            })}
            loading={rejectMutation.isPending}
          >
            Reject Request
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
