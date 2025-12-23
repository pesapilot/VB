import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { socialFundApi, membersApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function SocialFund() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    month_year: format(new Date(), 'yyyy-MM'),
    purpose: ''
  })

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['social-fund'],
    queryFn: socialFundApi.getAll,
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  })

  const contributeMutation = useMutation({
    mutationFn: socialFundApi.contribute,
    onSuccess: () => {
      queryClient.invalidateQueries(['social-fund'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['members-summary'])
      setIsContributeModalOpen(false)
      resetForm()
    }
  })

  const withdrawMutation = useMutation({
    mutationFn: socialFundApi.requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries(['social-fund'])
      queryClient.invalidateQueries(['dashboard-stats'])
      setIsWithdrawModalOpen(false)
      resetForm()
    }
  })

  const approveMutation = useMutation({
    mutationFn: ({ id }) => socialFundApi.approveWithdrawal(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['social-fund'])
      queryClient.invalidateQueries(['dashboard-stats'])
    }
  })

  const resetForm = () => {
    setFormData({
      member_id: '',
      amount: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      month_year: format(new Date(), 'yyyy-MM'),
      purpose: ''
    })
  }

  const handleContribute = (e) => {
    e.preventDefault()
    contributeMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      status: 'completed'
    })
  }

  const handleWithdraw = (e) => {
    e.preventDefault()
    withdrawMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const filteredTransactions = transactions?.data?.filter(t => {
    const matchesSearch = t.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter
    return matchesSearch && matchesType
  }) || []

  // Calculate totals
  const totalContributions = transactions?.data
    ?.filter(t => t.transaction_type === 'contribution' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

  const totalWithdrawals = transactions?.data
    ?.filter(t => t.transaction_type === 'withdrawal' && ['completed', 'approved'].includes(t.status))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

  const balance = totalContributions - totalWithdrawals

  const pendingWithdrawals = transactions?.data?.filter(t => 
    t.transaction_type === 'withdrawal' && t.status === 'pending'
  ).length || 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Fund</h1>
          <p className="text-gray-500 mt-1">Manage social fund contributions and withdrawals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setIsContributeModalOpen(true); }}>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Contribute
          </Button>
          <Button variant="secondary" onClick={() => { resetForm(); setIsWithdrawModalOpen(true); }}>
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Contributions</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalContributions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Withdrawals</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingWithdrawals}</p>
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="all">All Transactions</option>
              <option value="contribution">Contributions</option>
              <option value="withdrawal">Withdrawals</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.members?.full_name}</TableCell>
                    <TableCell>
                      {transaction.transaction_type === 'contribution' ? (
                        <Badge variant="success">
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Contribution
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Withdrawal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={`font-semibold ${
                      transaction.transaction_type === 'contribution' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'contribution' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{transaction.month_year}</TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                      {transaction.purpose || '-'}
                    </TableCell>
                    <TableCell>
                      {transaction.transaction_type === 'withdrawal' && transaction.status === 'pending' && (
                        <button
                          onClick={() => approveMutation.mutate({ id: transaction.id })}
                          className="p-1 text-gray-500 hover:text-green-600 rounded"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contribute Modal */}
      <Modal isOpen={isContributeModalOpen} onClose={() => setIsContributeModalOpen(false)}>
        <ModalHeader onClose={() => setIsContributeModalOpen(false)}>
          Record Contribution
        </ModalHeader>
        <form onSubmit={handleContribute}>
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
                <Label required>Date</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsContributeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={contributeMutation.isPending}>
              Record Contribution
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)}>
        <ModalHeader onClose={() => setIsWithdrawModalOpen(false)}>
          Request Withdrawal
        </ModalHeader>
        <form onSubmit={handleWithdraw}>
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
                max={balance}
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Available: {formatCurrency(balance)}</p>
            </div>
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>Purpose / Reason</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
                placeholder="Reason for withdrawal (e.g., medical emergency)..."
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={withdrawMutation.isPending}>
              Submit Request
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
