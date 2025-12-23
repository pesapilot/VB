import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Check, XCircle } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import { penaltiesApi, membersApi, loansApi } from '../../lib/api'
import { format } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

const penaltyTypes = {
  late_deposit: 'Late Deposit',
  late_repayment: 'Late Repayment',
  default: 'Default',
  other: 'Other'
}

export default function Penalties() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    member_id: '',
    loan_id: '',
    amount: '',
    penalty_type: 'late_deposit',
    penalty_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  })

  const queryClient = useQueryClient()

  const { data: penalties, isLoading } = useQuery({
    queryKey: ['penalties'],
    queryFn: penaltiesApi.getAll,
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  })

  const { data: loans } = useQuery({
    queryKey: ['loans'],
    queryFn: loansApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: penaltiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['penalties'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['members-summary'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const markPaidMutation = useMutation({
    mutationFn: penaltiesApi.markPaid,
    onSuccess: () => {
      queryClient.invalidateQueries(['penalties'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['members-summary'])
    }
  })

  const waiveMutation = useMutation({
    mutationFn: penaltiesApi.waive,
    onSuccess: () => {
      queryClient.invalidateQueries(['penalties'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['members-summary'])
    }
  })

  const resetForm = () => {
    setFormData({
      member_id: '',
      loan_id: '',
      amount: '',
      penalty_type: 'late_deposit',
      penalty_date: format(new Date(), 'yyyy-MM-dd'),
      reason: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      loan_id: formData.loan_id || null
    })
  }

  const filteredPenalties = penalties?.data?.filter(penalty => {
    const matchesSearch = penalty.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || penalty.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  // Calculate totals
  const totalUnpaid = penalties?.data
    ?.filter(p => p.status === 'unpaid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

  const totalPaid = penalties?.data
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

  const totalWaived = penalties?.data
    ?.filter(p => p.status === 'waived')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

  // Get member's active loans for the form
  const memberLoans = loans?.data?.filter(l => 
    l.member_id === formData.member_id && ['disbursed', 'repaying'].includes(l.status)
  ) || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penalties</h1>
          <p className="text-gray-500 mt-1">Track and manage member penalties</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Penalty
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Unpaid Penalties</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Waived</p>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(totalWaived)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Penalties</p>
            <p className="text-2xl font-bold text-gray-900">{penalties?.data?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Penalties table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredPenalties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPenalties.map((penalty) => (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">{penalty.members?.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{penaltyTypes[penalty.penalty_type]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {formatCurrency(penalty.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(penalty.penalty_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                      {penalty.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={penalty.status} />
                    </TableCell>
                    <TableCell>
                      {penalty.status === 'unpaid' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => markPaidMutation.mutate(penalty.id)}
                            className="p-1 text-gray-500 hover:text-green-600 rounded"
                            title="Mark as Paid"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => waiveMutation.mutate(penalty.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                            title="Waive"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No penalties found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Penalty Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          Add Penalty
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label required>Member</Label>
              <Select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value, loan_id: '' })}
                required
              >
                <option value="">Select member</option>
                {members?.data?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Penalty Type</Label>
              <Select
                value={formData.penalty_type}
                onChange={(e) => setFormData({ ...formData, penalty_type: e.target.value })}
                required
              >
                <option value="late_deposit">Late Deposit</option>
                <option value="late_repayment">Late Repayment</option>
                <option value="default">Default</option>
                <option value="other">Other</option>
              </Select>
            </div>
            {['late_repayment', 'default'].includes(formData.penalty_type) && memberLoans.length > 0 && (
              <div>
                <Label>Related Loan</Label>
                <Select
                  value={formData.loan_id}
                  onChange={(e) => setFormData({ ...formData, loan_id: e.target.value })}
                >
                  <option value="">Select loan (optional)</option>
                  {memberLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {formatCurrency(loan.total_amount)} - {loan.status}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label required>Amount (KES)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>Penalty Date</Label>
              <Input
                type="date"
                value={formData.penalty_date}
                onChange={(e) => setFormData({ ...formData, penalty_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
                placeholder="Reason for penalty..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add Penalty
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
