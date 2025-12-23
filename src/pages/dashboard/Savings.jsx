import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Calendar } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { savingsApi, membersApi } from '../../lib/api'
import { format } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function Savings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    deposit_date: format(new Date(), 'yyyy-MM-dd'),
    month_year: format(new Date(), 'yyyy-MM'),
    status: 'completed',
    notes: ''
  })

  const queryClient = useQueryClient()

  const { data: savings, isLoading } = useQuery({
    queryKey: ['savings'],
    queryFn: savingsApi.getAll,
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: savingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['savings'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['members-summary'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const resetForm = () => {
    setFormData({
      member_id: '',
      amount: '',
      deposit_date: format(new Date(), 'yyyy-MM-dd'),
      month_year: format(new Date(), 'yyyy-MM'),
      status: 'completed',
      notes: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const filteredSavings = savings?.data?.filter(saving =>
    saving.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Calculate totals
  const totalSavings = filteredSavings.reduce((sum, s) => sum + parseFloat(s.amount), 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings</h1>
          <p className="text-gray-500 mt-1">Track member savings deposits</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Record Deposit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Deposits</p>
            <p className="text-2xl font-bold text-gray-900">{filteredSavings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Members</p>
            <p className="text-2xl font-bold text-primary-600">{members?.data?.length || 0}</p>
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

      {/* Savings table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredSavings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deposit Date</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSavings.map((saving) => (
                  <TableRow key={saving.id}>
                    <TableCell className="font-medium">{saving.members?.full_name}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(saving.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(saving.deposit_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{saving.month_year}</TableCell>
                    <TableCell>
                      <StatusBadge status={saving.status} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                      {saving.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No savings records found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Deposit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          Record Savings Deposit
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label required>Member</Label>
              <Select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
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
                <Label required>Deposit Date</Label>
                <Input
                  type="date"
                  value={formData.deposit_date}
                  onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })}
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
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="late">Late</option>
              </Select>
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
              Record Deposit
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
