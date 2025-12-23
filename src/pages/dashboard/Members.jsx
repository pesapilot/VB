import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { membersApi } from '../../lib/api'
import { format } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function Members() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    address: '',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: members, isLoading } = useQuery({
    queryKey: ['members-summary'],
    queryFn: membersApi.getSummary,
  })

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['members-summary'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => membersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['members-summary'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['members-summary'])
    }
  })

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      national_id: '',
      address: '',
      status: 'active'
    })
    setSelectedMember(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedMember) {
      updateMutation.mutate({ id: selectedMember.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (member) => {
    setSelectedMember(member)
    setFormData({
      full_name: member.full_name,
      phone: member.phone || '',
      email: member.email || '',
      national_id: member.national_id || '',
      address: member.address || '',
      status: member.status
    })
    setIsModalOpen(true)
  }

  const handleView = (member) => {
    setSelectedMember(member)
    setIsViewModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredMembers = members?.data?.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">Manage village banking group members</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Outstanding Loans</TableHead>
                  <TableHead>Penalties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{member.full_name}</div>
                      <div className="text-sm text-gray-500">
                        Joined: {member.join_date ? format(new Date(member.join_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(member.total_savings || 0)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatCurrency(member.outstanding_loans || 0)}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(member.unpaid_penalties || 0)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(member)}
                          className="p-1 text-gray-500 hover:text-primary-600 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No members found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          {selectedMember ? 'Edit Member' : 'Add New Member'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label required>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>National ID</Label>
              <Input
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {selectedMember ? 'Update' : 'Add'} Member
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} className="max-w-lg">
        <ModalHeader onClose={() => setIsViewModalOpen(false)}>
          Member Details
        </ModalHeader>
        <ModalBody>
          {selectedMember && (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary-600">
                    {selectedMember.full_name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{selectedMember.full_name}</h3>
                <StatusBadge status={selectedMember.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedMember.total_savings || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Outstanding Loans</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(selectedMember.outstanding_loans || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Social Fund</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatCurrency(selectedMember.social_fund_balance || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unpaid Penalties</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(selectedMember.unpaid_penalties || 0)}
                  </p>
                </div>
              </div>

              {selectedMember.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {selectedMember.phone}
                </div>
              )}

              <div className="text-sm text-gray-500">
                Member since: {selectedMember.join_date ? format(new Date(selectedMember.join_date), 'MMMM d, yyyy') : 'N/A'}
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}
