import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label } from '../../components/ui/Input'
import { settingsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Settings() {
  const [settings, setSettings] = useState({
    interest_rate: '',
    max_loan_multiplier: '',
    late_deposit_penalty: '',
    late_repayment_penalty_percent: '',
    monthly_savings_amount: '',
    social_fund_amount: '',
    loan_duration_months: '',
    currency: ''
  })
  const [hasChanges, setHasChanges] = useState(false)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  })

  useEffect(() => {
    if (settingsData?.data) {
      const settingsMap = {}
      settingsData.data.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value
      })
      setSettings(settingsMap)
    }
  }, [settingsData])

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings) => {
      const promises = Object.entries(updatedSettings).map(([key, value]) =>
        settingsApi.update(key, value, user?.id)
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      setHasChanges(false)
    }
  })

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateMutation.mutate(settings)
  }

  const handleReset = () => {
    if (settingsData?.data) {
      const settingsMap = {}
      settingsData.data.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value
      })
      setSettings(settingsMap)
      setHasChanges(false)
    }
  }

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure group policies and rules</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="secondary" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges} loading={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Settings</CardTitle>
            <CardDescription>Configure loan policies and interest rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Interest Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.interest_rate}
                onChange={(e) => handleChange('interest_rate', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Applied to all new loans
              </p>
            </div>
            <div>
              <Label>Maximum Loan Multiplier</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.max_loan_multiplier}
                onChange={(e) => handleChange('max_loan_multiplier', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Max loan = Member savings × {settings.max_loan_multiplier || '3'}
              </p>
            </div>
            <div>
              <Label>Default Loan Duration (Months)</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={settings.loan_duration_months}
                onChange={(e) => handleChange('loan_duration_months', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Savings Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Settings</CardTitle>
            <CardDescription>Configure savings requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Monthly Savings Amount ({settings.currency})</Label>
              <Input
                type="number"
                min="0"
                value={settings.monthly_savings_amount}
                onChange={(e) => handleChange('monthly_savings_amount', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Required monthly contribution from each member
              </p>
            </div>
            <div>
              <Label>Social Fund Contribution ({settings.currency})</Label>
              <Input
                type="number"
                min="0"
                value={settings.social_fund_amount}
                onChange={(e) => handleChange('social_fund_amount', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Monthly social fund contribution per member
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Penalty Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Penalty Settings</CardTitle>
            <CardDescription>Configure penalty rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Late Deposit Penalty ({settings.currency})</Label>
              <Input
                type="number"
                min="0"
                value={settings.late_deposit_penalty}
                onChange={(e) => handleChange('late_deposit_penalty', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Fixed penalty for late savings deposits
              </p>
            </div>
            <div>
              <Label>Late Repayment Penalty (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.late_repayment_penalty_percent}
                onChange={(e) => handleChange('late_repayment_penalty_percent', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Percentage of outstanding amount charged for late loan repayments
              </p>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Currency Code</Label>
              <Input
                type="text"
                maxLength="3"
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                placeholder="KES"
              />
              <p className="text-sm text-gray-500 mt-1">
                3-letter currency code (e.g., KES, USD, EUR)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">About Settings</h3>
              <p className="text-sm text-blue-700 mt-1">
                Changes to these settings will apply to new transactions only. Existing loans and penalties will not be affected.
                Only administrators can modify these settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
