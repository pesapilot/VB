import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Textarea } from '../../components/ui/Input'
import { groupsApi } from '../../lib/api'

export default function CreateGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  })

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-groups'])
      setSuccess(true)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Group Created!</h2>
            <p className="text-gray-600 mb-6">
              Your group "{formData.name}" has been created and is pending approval from a super admin.
              You'll be notified once it's approved.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard/groups')} className="w-full">
                View My Groups
              </Button>
              <Button variant="secondary" onClick={() => { setSuccess(false); setFormData({ name: '', description: '', location: '' }); }} className="w-full">
                Create Another Group
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/groups')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Groups
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Create New Group</CardTitle>
              <CardDescription>Set up a new village banking group</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label required>Group Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sunrise Village Savings Group"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your group's purpose and goals..."
                rows={3}
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Nairobi, Kenya"
              />
            </div>

            {createMutation.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {createMutation.error.message || 'Failed to create group. Please try again.'}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your group will be submitted for approval</li>
                <li>• A super admin will review your request</li>
                <li>• You'll be notified once approved</li>
                <li>• You'll automatically become the group admin</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/groups')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
