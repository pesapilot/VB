import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { FileDown, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { dashboardApi, savingsApi, loansApi, repaymentsApi, socialFundApi, penaltiesApi } from '../../lib/api'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#9333ea', '#f59e0b', '#06b6d4']

export default function Reports() {
  const [period, setPeriod] = useState('6')

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  })

  const { data: savings } = useQuery({
    queryKey: ['savings'],
    queryFn: savingsApi.getAll,
  })

  const { data: loans } = useQuery({
    queryKey: ['loans'],
    queryFn: loansApi.getAll,
  })

  const { data: repayments } = useQuery({
    queryKey: ['repayments'],
    queryFn: repaymentsApi.getAll,
  })

  const { data: socialFund } = useQuery({
    queryKey: ['social-fund'],
    queryFn: socialFundApi.getAll,
  })

  const { data: penalties } = useQuery({
    queryKey: ['penalties'],
    queryFn: penaltiesApi.getAll,
  })

  // Generate monthly data for charts
  const generateMonthlyData = () => {
    const months = []
    const numMonths = parseInt(period)
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthYear = format(date, 'yyyy-MM')
      const monthLabel = format(date, 'MMM yyyy')

      const monthSavings = savings?.data
        ?.filter(s => s.month_year === monthYear && s.status === 'completed')
        .reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0

      const monthLoans = loans?.data
        ?.filter(l => l.disbursement_date && format(new Date(l.disbursement_date), 'yyyy-MM') === monthYear)
        .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0) || 0

      const monthRepayments = repayments?.data
        ?.filter(r => r.month_year === monthYear)
        .reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0

      const monthSocialFund = socialFund?.data
        ?.filter(t => t.month_year === monthYear && t.transaction_type === 'contribution' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

      months.push({
        month: monthLabel,
        savings: monthSavings,
        loans: monthLoans,
        repayments: monthRepayments,
        socialFund: monthSocialFund
      })
    }

    return months
  }

  const monthlyData = generateMonthlyData()

  // Loan status distribution
  const loanStatusData = [
    { name: 'Pending', value: loans?.data?.filter(l => l.status === 'pending').length || 0 },
    { name: 'Approved', value: loans?.data?.filter(l => l.status === 'approved').length || 0 },
    { name: 'Disbursed', value: loans?.data?.filter(l => l.status === 'disbursed').length || 0 },
    { name: 'Repaying', value: loans?.data?.filter(l => l.status === 'repaying').length || 0 },
    { name: 'Completed', value: loans?.data?.filter(l => l.status === 'completed').length || 0 },
    { name: 'Defaulted', value: loans?.data?.filter(l => l.status === 'defaulted').length || 0 },
  ].filter(item => item.value > 0)

  // Penalty status distribution
  const penaltyStatusData = [
    { name: 'Unpaid', value: penalties?.data?.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0 },
    { name: 'Paid', value: penalties?.data?.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0 },
    { name: 'Waived', value: penalties?.data?.filter(p => p.status === 'waived').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0 },
  ].filter(item => item.value > 0)

  // Summary totals
  const totalSavings = savings?.data?.filter(s => s.status === 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0
  const totalLoansIssued = loans?.data?.filter(l => ['disbursed', 'repaying', 'completed'].includes(l.status)).reduce((sum, l) => sum + parseFloat(l.principal_amount), 0) || 0
  const totalRepayments = repayments?.data?.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0
  const totalSocialFund = socialFund?.data?.filter(t => t.status === 'completed').reduce((sum, t) => t.transaction_type === 'contribution' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount), 0) || 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Financial overview and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
            </Select>
          </div>
          <Button variant="secondary">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Loans Issued</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalLoansIssued)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Repayments Collected</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRepayments)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Social Fund Balance</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSocialFund)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Savings & Repayments */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="savings" name="Savings" fill="#16a34a" />
                  <Bar dataKey="repayments" name="Repayments" fill="#9333ea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loans Disbursed */}
        <Card>
          <CardHeader>
            <CardTitle>Loans Disbursed vs Social Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="loans" name="Loans" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="socialFund" name="Social Fund" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loan Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Portfolio Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No loan data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Penalty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Penalty Collection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {penaltyStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={penaltyStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {penaltyStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : index === 1 ? '#16a34a' : '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No penalty data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Month</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Savings</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Loans Disbursed</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Repayments</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Social Fund</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyData.map((row, index) => {
                  const netCashFlow = row.savings + row.repayments + row.socialFund - row.loans
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{row.month}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrency(row.savings)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(row.loans)}</td>
                      <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(row.repayments)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(row.socialFund)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netCashFlow)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
