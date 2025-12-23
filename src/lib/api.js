import { supabase } from './supabase'

// ============================================
// GROUPS API
// ============================================
export const groupsApi = {
  getMyGroups: async () => {
    const { data, error } = await supabase
      .from('my_groups')
      .select('*')
      .order('name')
    return { data, error }
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_memberships(count)')
      .eq('status', 'active')
      .order('name')
    return { data, error }
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (group) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('groups')
      .insert({ ...group, created_by: user?.id })
      .select()
      .single()
    return { data, error }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  getPendingRequests: async () => {
    const { data, error } = await supabase
      .from('group_requests')
      .select('*, groups(*), profiles!requested_by(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  approveRequest: async (requestId, adminNotes = '') => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('group_requests')
      .update({ 
        status: 'approved', 
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', requestId)
      .select()
      .single()
    return { data, error }
  },

  rejectRequest: async (requestId, adminNotes) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('group_requests')
      .update({ 
        status: 'rejected', 
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', requestId)
      .select()
      .single()
    return { data, error }
  }
}

// ============================================
// GROUP MEMBERSHIPS API
// ============================================
export const membershipsApi = {
  getByGroup: async (groupId) => {
    const { data, error } = await supabase
      .from('group_memberships')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('group_id', groupId)
      .order('role')
    return { data, error }
  },

  addMember: async (groupId, userId, role = 'member') => {
    const { data, error } = await supabase
      .from('group_memberships')
      .insert({ group_id: groupId, user_id: userId, role })
      .select()
      .single()
    return { data, error }
  },

  updateRole: async (id, role) => {
    const { data, error } = await supabase
      .from('group_memberships')
      .update({ role })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  remove: async (id) => {
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('id', id)
    return { error }
  }
}

// ============================================
// MEMBERS API (Group-scoped)
// ============================================
export const membersApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .order('full_name')
    return { data, error }
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  getSummary: async (groupId) => {
    const { data, error } = await supabase
      .from('member_summary')
      .select('*')
      .eq('group_id', groupId)
      .order('full_name')
    return { data, error }
  },

  create: async (groupId, member) => {
    const { data, error } = await supabase
      .from('members')
      .insert({ ...member, group_id: groupId })
      .select()
      .single()
    return { data, error }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
    return { error }
  }
}

// ============================================
// SAVINGS API (Group-scoped)
// ============================================
export const savingsApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('savings')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .order('deposit_date', { ascending: false })
    return { data, error }
  },

  getByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .eq('member_id', memberId)
      .order('deposit_date', { ascending: false })
    return { data, error }
  },

  getByMonth: async (groupId, monthYear) => {
    const { data, error } = await supabase
      .from('savings')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .eq('month_year', monthYear)
      .order('deposit_date', { ascending: false })
    return { data, error }
  },

  create: async (groupId, saving) => {
    const { data, error } = await supabase
      .from('savings')
      .insert({ ...saving, group_id: groupId })
      .select()
      .single()
    return { data, error }
  },

  getTotalByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('savings')
      .select('amount')
      .eq('member_id', memberId)
      .eq('status', 'completed')
    
    const total = data?.reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0
    return { data: total, error }
  }
}

// ============================================
// LOANS API (Group-scoped)
// ============================================
export const loansApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*, members(full_name)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  getByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getPending: async (groupId) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getActive: async (groupId) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .in('status', ['disbursed', 'repaying'])
      .order('created_at', { ascending: false })
    return { data, error }
  },

  create: async (groupId, loan) => {
    const totalAmount = parseFloat(loan.principal_amount) * (1 + parseFloat(loan.interest_rate) / 100)
    const { data, error } = await supabase
      .from('loans')
      .insert({ ...loan, group_id: groupId, total_amount: totalAmount })
      .select()
      .single()
    return { data, error }
  },

  approve: async (id, approvedBy) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: 'approved', 
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  reject: async (id) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  disburse: async (id, disbursementDate) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: 'disbursed',
        disbursement_date: disbursementDate
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }
}

// ============================================
// LOAN REPAYMENTS API (Group-scoped)
// ============================================
export const repaymentsApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('loan_repayments')
      .select('*, loans(principal_amount, total_amount), members(full_name)')
      .eq('group_id', groupId)
      .order('payment_date', { ascending: false })
    return { data, error }
  },

  getByLoan: async (loanId) => {
    const { data, error } = await supabase
      .from('loan_repayments')
      .select('*')
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: false })
    return { data, error }
  },

  getByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('loan_repayments')
      .select('*, loans(principal_amount, total_amount)')
      .eq('member_id', memberId)
      .order('payment_date', { ascending: false })
    return { data, error }
  },

  create: async (groupId, repayment) => {
    const { data, error } = await supabase
      .from('loan_repayments')
      .insert({ ...repayment, group_id: groupId })
      .select()
      .single()
    return { data, error }
  },

  getTotalByLoan: async (loanId) => {
    const { data, error } = await supabase
      .from('loan_repayments')
      .select('amount')
      .eq('loan_id', loanId)
    
    const total = data?.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0
    return { data: total, error }
  }
}

// ============================================
// SOCIAL FUND API (Group-scoped)
// ============================================
export const socialFundApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('social_fund')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .order('transaction_date', { ascending: false })
    return { data, error }
  },

  getByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('social_fund')
      .select('*')
      .eq('member_id', memberId)
      .order('transaction_date', { ascending: false })
    return { data, error }
  },

  contribute: async (groupId, contribution) => {
    const { data, error } = await supabase
      .from('social_fund')
      .insert({ ...contribution, group_id: groupId, transaction_type: 'contribution' })
      .select()
      .single()
    return { data, error }
  },

  requestWithdrawal: async (groupId, withdrawal) => {
    const { data, error } = await supabase
      .from('social_fund')
      .insert({ ...withdrawal, group_id: groupId, transaction_type: 'withdrawal', status: 'pending' })
      .select()
      .single()
    return { data, error }
  },

  approveWithdrawal: async (id, approvedBy) => {
    const { data, error } = await supabase
      .from('social_fund')
      .update({ status: 'approved', approved_by: approvedBy })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  getTotalBalance: async (groupId) => {
    const { data, error } = await supabase
      .from('social_fund')
      .select('amount, transaction_type')
      .eq('group_id', groupId)
      .eq('status', 'completed')
    
    const total = data?.reduce((sum, t) => {
      return t.transaction_type === 'contribution' 
        ? sum + parseFloat(t.amount) 
        : sum - parseFloat(t.amount)
    }, 0) || 0
    return { data: total, error }
  }
}

// ============================================
// PENALTIES API (Group-scoped)
// ============================================
export const penaltiesApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('penalties')
      .select('*, members(full_name), loans(principal_amount)')
      .eq('group_id', groupId)
      .order('penalty_date', { ascending: false })
    return { data, error }
  },

  getByMember: async (memberId) => {
    const { data, error } = await supabase
      .from('penalties')
      .select('*, loans(principal_amount)')
      .eq('member_id', memberId)
      .order('penalty_date', { ascending: false })
    return { data, error }
  },

  getUnpaid: async (groupId) => {
    const { data, error } = await supabase
      .from('penalties')
      .select('*, members(full_name)')
      .eq('group_id', groupId)
      .eq('status', 'unpaid')
      .order('penalty_date', { ascending: false })
    return { data, error }
  },

  create: async (groupId, penalty) => {
    const { data, error } = await supabase
      .from('penalties')
      .insert({ ...penalty, group_id: groupId })
      .select()
      .single()
    return { data, error }
  },

  markPaid: async (id) => {
    const { data, error } = await supabase
      .from('penalties')
      .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  waive: async (id) => {
    const { data, error } = await supabase
      .from('penalties')
      .update({ status: 'waived' })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }
}

// ============================================
// SETTINGS API (Group-scoped)
// ============================================
export const settingsApi = {
  getAll: async (groupId) => {
    const { data, error } = await supabase
      .from('group_settings')
      .select('*')
      .eq('group_id', groupId)
      .order('setting_key')
    return { data, error }
  },

  get: async (groupId, key) => {
    const { data, error } = await supabase
      .from('group_settings')
      .select('setting_value')
      .eq('group_id', groupId)
      .eq('setting_key', key)
      .single()
    return { data: data?.setting_value, error }
  },

  update: async (groupId, key, value, updatedBy) => {
    const { data, error } = await supabase
      .from('group_settings')
      .update({ setting_value: value, updated_by: updatedBy })
      .eq('group_id', groupId)
      .eq('setting_key', key)
      .select()
      .single()
    return { data, error }
  }
}

// ============================================
// PROFILES API
// ============================================
export const profilesApi = {
  getCurrent: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return { data, error }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    return { data, error }
  }
}

// ============================================
// DASHBOARD STATS API (Group-scoped)
// ============================================
export const dashboardApi = {
  getStats: async (groupId) => {
    const [members, savings, loans, socialFund, penalties] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact' }).eq('group_id', groupId).eq('status', 'active'),
      supabase.from('savings').select('amount').eq('group_id', groupId).eq('status', 'completed'),
      supabase.from('loans').select('total_amount, status').eq('group_id', groupId),
      supabase.from('social_fund').select('amount, transaction_type').eq('group_id', groupId).eq('status', 'completed'),
      supabase.from('penalties').select('amount').eq('group_id', groupId).eq('status', 'unpaid')
    ])

    const totalSavings = savings.data?.reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0
    const activeLoans = loans.data?.filter(l => ['disbursed', 'repaying'].includes(l.status)) || []
    const totalLoansOutstanding = activeLoans.reduce((sum, l) => sum + parseFloat(l.total_amount), 0)
    const socialFundBalance = socialFund.data?.reduce((sum, t) => {
      return t.transaction_type === 'contribution' 
        ? sum + parseFloat(t.amount) 
        : sum - parseFloat(t.amount)
    }, 0) || 0
    const totalUnpaidPenalties = penalties.data?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    return {
      totalMembers: members.count || 0,
      totalSavings,
      totalLoansOutstanding,
      activeLoansCount: activeLoans.length,
      socialFundBalance,
      totalUnpaidPenalties,
      pendingLoans: loans.data?.filter(l => l.status === 'pending').length || 0
    }
  }
}
