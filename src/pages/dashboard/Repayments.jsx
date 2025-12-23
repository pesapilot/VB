import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Calendar } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { repaymentsApi, loansApi, membersApi } from '../../lib/api'
import { format } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function Repayments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [formData, setFormData] = useState({
    loan_id: '',
    member_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    month_year: format(new Date(), 'yyyy-MM'),
    is_late: false,
    notes: ''
  })

  const queryClient = useQueryClient()

  const { data: repayments, isLoading } = useQuery({
    queryKey: ['repayments'],
    queryFn: repaymentsApi.getAll,
  })

  const { data: activeLoans } = useQuery({
    queryKey: ['active-loans'],
    queryFn: loansApi.getActive,
  })

  const createMutation = useMutation({
    mutationFn: repaymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['repayments'])
      queryClient.invalidateQueries(['loans'])
      queryClient.invalidateQueries(['dashboard-stats'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const resetForm = () => {
    setFormData({
      loan_id: '',
      member_id: '',
      amount: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      month_year: format(new Date(), 'yyyy-MM'),
      is_late: false,
      notes: ''
    })
    setSelectedLoan(null)
  }

  const handleLoanChange = (loanId) => {
    const loan = activeLoans?.data?.find(l => l.id === loanId)
    setSelectedLoan(loan)
    setFormData({
      ...formData,
      loan_id: loanId,
      member_id: loan?.member_id || ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const filteredRepayments = repayments?.data?.filter(repayment =>
    repayment.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Calculate totals
  const totalRepayments = filteredRepayments.reduce((sum, r) => sum + parseFloat(r.amount), 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repayments</h1>
          <p className="text-gray-500 mt-1">Track loan repayments</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Record Repayment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRepayments)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{filteredRepayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Loans</p>
            <p className="text-2xl font-bold text-blue-600">{activeLoans?.data?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Repayments table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredRepayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Loan Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepayments.map((repayment) => (
                  <TableRow key={repayment.id}>
                    <TableCell className="font-medium">{repayment.members?.full_name}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(repayment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(repayment.payment_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{repayment.month_year}</TableCell>
                    <TableCell className="text-gray-600">
                      {repayment.loans ? formatCurrency(repayment.loans.total_amount) : '-'}
                    </TableCell>
                    <TableCell>
                      {repayment.is_late ? (
                        <Badge variant="warning">Late</Badge>
                      ) : (
                        <Badge variant="success">On Time</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                      {repayment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No repayments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Repayment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          Record Loan Repayment
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label required>Select Loan</Label>
              <Select
                value={formData.loan_id}
                onChange={(e) => handleLoanChange(e.target.value)}
                required
              >
                <option value="">Select active loan</option>
                {activeLoans?.data?.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.members?.full_name} - {formatCurrency(loan.total_amount)}
                  </option>
                ))}
              </Select>
            </div>

            {selectedLoan && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><span className="font-medium">Loan Amount:</span> {formatCurrency(selectedLoan.total_amount)}</p>
                <p><span className="font-medium">Monthly Installment:</span> {formatCurrency(selectedLoan.total_amount / selectedLoan.duration_months)}</p>
                <p><span className="font-medium">Due Date:</span> {selectedLoan.due_date ? format(new Date(selectedLoan.due_date), 'MMM d, yyyy') : '-'}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Payment Date</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label required>Month/Year</Label>
                <Input
                  type="month"
                  value={formData.month_year}
                  onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_late"
                checked={formData.is_late}
                onChange={(e) => setFormData({ ...formData, is_late: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="is_late" className="text-sm text-gray-700">
                Mark as late payment
              </label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Record Payment
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
