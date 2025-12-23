import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Check, X, Banknote, Eye } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { loansApi, membersApi, savingsApi, settingsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { format, addMonths } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function Loans() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [maxLoanAmount, setMaxLoanAmount] = useState(0)
  const [formData, setFormData] = useState({
    member_id: '',
    principal_amount: '',
    interest_rate: '10',
    duration_months: '3',
    purpose: ''
  })

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: loansApi.getAll,
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['loans'])
      queryClient.invalidateQueries(['dashboard-stats'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const approveMutation = useMutation({
    mutationFn: ({ id }) => loansApi.approve(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans'])
      queryClient.invalidateQueries(['dashboard-stats'])
    }
  })

  const rejectMutation = useMutation({
    mutationFn: loansApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries(['loans'])
      queryClient.invalidateQueries(['dashboard-stats'])
    }
  })

  const disburseMutation = useMutation({
    mutationFn: ({ id }) => loansApi.disburse(id, format(new Date(), 'yyyy-MM-dd')),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans'])
      queryClient.invalidateQueries(['dashboard-stats'])
    }
  })

  const resetForm = () => {
    setFormData({
      member_id: '',
      principal_amount: '',
      interest_rate: '10',
      duration_months: '3',
      purpose: ''
    })
    setMaxLoanAmount(0)
  }

  const handleMemberChange = async (memberId) => {
    setFormData({ ...formData, member_id: memberId })
    if (memberId) {
      const { data: totalSavings } = await savingsApi.getTotalByMember(memberId)
      const { data: multiplier } = await settingsApi.get('max_loan_multiplier')
      setMaxLoanAmount(totalSavings * (parseInt(multiplier) || 3))
    } else {
      setMaxLoanAmount(0)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const dueDate = addMonths(new Date(), parseInt(formData.duration_months))
    createMutation.mutate({
      ...formData,
      principal_amount: parseFloat(formData.principal_amount),
      interest_rate: parseFloat(formData.interest_rate),
      duration_months: parseInt(formData.duration_months),
      due_date: format(dueDate, 'yyyy-MM-dd')
    })
  }

  const handleView = (loan) => {
    setSelectedLoan(loan)
    setIsViewModalOpen(true)
  }

  const filteredLoans = loans?.data?.filter(loan => {
    const matchesSearch = loan.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  // Calculate totals
  const totalDisbursed = filteredLoans
    .filter(l => ['disbursed', 'repaying', 'completed'].includes(l.status))
    .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0)

  const totalOutstanding = filteredLoans
    .filter(l => ['disbursed', 'repaying'].includes(l.status))
    .reduce((sum, l) => sum + parseFloat(l.total_amount), 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-500 mt-1">Manage loan requests and disbursements</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Loan Request
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Disbursed</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDisbursed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredLoans.filter(l => l.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Loans</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredLoans.filter(l => ['disbursed', 'repaying'].includes(l.status)).length}
            </p>
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disbursed">Disbursed</option>
              <option value="repaying">Repaying</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loans table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredLoans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Total (+ Interest)</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="font-medium">{loan.members?.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(loan.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(loan.principal_amount)}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {formatCurrency(loan.total_amount)}
                    </TableCell>
                    <TableCell>{loan.duration_months} months</TableCell>
                    <TableCell>
                      {loan.due_date ? format(new Date(loan.due_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={loan.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleView(loan)}
                          className="p-1 text-gray-500 hover:text-primary-600 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {loan.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate({ id: loan.id })}
                              className="p-1 text-gray-500 hover:text-green-600 rounded"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(loan.id)}
                              className="p-1 text-gray-500 hover:text-red-600 rounded"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {loan.status === 'approved' && (
                          <button
                            onClick={() => disburseMutation.mutate({ id: loan.id })}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded"
                            title="Disburse"
                          >
                            <Banknote className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No loans found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Loan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          New Loan Request
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label required>Member</Label>
              <Select
                value={formData.member_id}
                onChange={(e) => handleMemberChange(e.target.value)}
                required
              >
                <option value="">Select member</option>
                {members?.data?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </Select>
              {maxLoanAmount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Maximum eligible: {formatCurrency(maxLoanAmount)}
                </p>
              )}
            </div>
            <div>
              <Label required>Principal Amount (KES)</Label>
              <Input
                type="number"
                min="0"
                max={maxLoanAmount || undefined}
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Interest Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label required>Duration (Months)</Label>
                <Select
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  required
                >
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </Select>
              </div>
            </div>
            {formData.principal_amount && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total Repayment: <span className="font-semibold text-gray-900">
                    {formatCurrency(parseFloat(formData.principal_amount) * (1 + parseFloat(formData.interest_rate) / 100))}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Monthly Installment: <span className="font-semibold text-gray-900">
                    {formatCurrency((parseFloat(formData.principal_amount) * (1 + parseFloat(formData.interest_rate) / 100)) / parseInt(formData.duration_months))}
                  </span>
                </p>
              </div>
            )}
            <div>
              <Label>Purpose</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={2}
                placeholder="Reason for loan..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Submit Request
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Loan Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} className="max-w-lg">
        <ModalHeader onClose={() => setIsViewModalOpen(false)}>
          Loan Details
        </ModalHeader>
        <ModalBody>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{selectedLoan.members?.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    Applied: {format(new Date(selectedLoan.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={selectedLoan.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Principal</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedLoan.principal_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Interest Rate</p>
                  <p className="text-lg font-semibold">{selectedLoan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedLoan.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">{selectedLoan.duration_months} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Installment</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedLoan.total_amount / selectedLoan.duration_months)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-lg font-semibold">
                    {selectedLoan.due_date ? format(new Date(selectedLoan.due_date), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>

              {selectedLoan.purpose && (
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="text-gray-700">{selectedLoan.purpose}</p>
                </div>
              )}

              {selectedLoan.disbursement_date && (
                <div>
                  <p className="text-sm text-gray-500">Disbursed On</p>
                  <p className="text-gray-700">{format(new Date(selectedLoan.disbursement_date), 'MMMM d, yyyy')}</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}
