'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CarPricingRule } from '@/lib/types/database';
import { Plus, Trash, Percent, CurrencyCircleDollar, Calendar, CheckCircle, X } from '@phosphor-icons/react';
import { formatDiscountDescription } from '@/lib/utils/pricing';

interface PricingRulesManagerProps {
  carId: string;
  dailyRate: number;
}

export default function PricingRulesManager({ carId, dailyRate }: PricingRulesManagerProps) {
  const [rules, setRules] = useState<CarPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [minDays, setMinDays] = useState('7');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  useEffect(() => {
    loadRules();
  }, [carId]);

  const loadRules = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('car_pricing_rules')
        .select('*')
        .eq('car_id', carId)
        .order('min_days', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (err: any) {
      console.error('Error loading pricing rules:', err);
      setError('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();

      // Validate inputs
      const minDaysNum = parseInt(minDays);
      const discountValueNum = parseFloat(discountValue);

      if (minDaysNum < 1) {
        throw new Error('Minimum days must be at least 1');
      }

      if (discountValueNum <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      if (discountType === 'percentage' && discountValueNum > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }

      // Check if rule with same min_days already exists
      const existingRule = rules.find(r => r.min_days === minDaysNum && r.is_active);
      if (existingRule) {
        throw new Error(`A rule for ${minDaysNum}+ days already exists`);
      }

      const { error } = await supabase.from('car_pricing_rules').insert({
        car_id: carId,
        rule_type: 'duration_discount',
        min_days: minDaysNum,
        discount_type: discountType,
        discount_value: discountValueNum,
        is_active: true,
      });

      if (error) throw error;

      setSuccess('Pricing rule added successfully!');
      setShowAddForm(false);
      setMinDays('7');
      setDiscountValue('');
      loadRules();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error adding pricing rule:', err);
      setError(err.message || 'Failed to add pricing rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('car_pricing_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setSuccess('Pricing rule deleted successfully!');
      loadRules();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting pricing rule:', err);
      setError('Failed to delete pricing rule');
    }
  };

  const toggleRuleStatus = async (rule: CarPricingRule) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('car_pricing_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;

      setSuccess(`Pricing rule ${!rule.is_active ? 'activated' : 'deactivated'}!`);
      loadRules();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating pricing rule:', err);
      setError('Failed to update pricing rule');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
            <Percent size={24} weight="duotone" className="text-primary-500" />
            Pricing Rules & Discounts
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Offer discounts for longer rental periods
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            Add Rule
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} weight="fill" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Rule Form */}
      {showAddForm && (
        <form onSubmit={handleAddRule} className="mb-6 p-4 border-2 border-primary-200 rounded-lg bg-primary-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">New Pricing Rule</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-secondary-500 hover:text-secondary-700 transition-colors"
            >
              <X size={24} weight="bold" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Minimum Days */}
            <div>
              <label htmlFor="minDays" className="block text-sm font-medium text-secondary-700 mb-2">
                <Calendar size={16} weight="duotone" className="inline mr-1" />
                Minimum Days
              </label>
              <input
                id="minDays"
                type="number"
                required
                min="1"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                className="block w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                placeholder="7"
              />
              <p className="text-xs text-secondary-500 mt-1">Min. rental days to apply</p>
            </div>

            {/* Discount Type */}
            <div>
              <label htmlFor="discountType" className="block text-sm font-medium text-secondary-700 mb-2">
                Discount Type
              </label>
              <select
                id="discountType"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="block w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label htmlFor="discountValue" className="block text-sm font-medium text-secondary-700 mb-2">
                Discount Value
              </label>
              <input
                id="discountValue"
                type="number"
                required
                min="0.01"
                step="0.01"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="block w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                placeholder={discountType === 'percentage' ? '10' : '500'}
              />
              <p className="text-xs text-secondary-500 mt-1">
                {discountType === 'percentage' ? 'Percentage off (0-100%)' : 'Amount off in pesos'}
              </p>
            </div>
          </div>

          {/* Preview */}
          {discountValue && minDays && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-secondary-200">
              <p className="text-sm text-secondary-600 mb-1">Preview:</p>
              <p className="font-semibold text-secondary-900">
                Book for {minDays}+ days and save{' '}
                {discountType === 'percentage'
                  ? `${discountValue}%`
                  : `₱${parseFloat(discountValue).toLocaleString()}`}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg font-semibold hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Rules */}
      {rules.length === 0 ? (
        <div className="text-center py-8">
          <Percent size={48} weight="duotone" className="text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-600 mb-2">No pricing rules yet</p>
          <p className="text-sm text-secondary-500">
            Add rules to offer discounts for longer rental periods
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                rule.is_active
                  ? 'border-primary-200 bg-primary-50/30'
                  : 'border-secondary-200 bg-secondary-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {rule.discount_type === 'percentage' ? (
                        <Percent size={24} weight="duotone" className="text-primary-500" />
                      ) : (
                        <CurrencyCircleDollar size={24} weight="duotone" className="text-primary-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900">
                        {formatDiscountDescription(rule)}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRuleStatus(rule)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      rule.is_active
                        ? 'bg-secondary-200 hover:bg-secondary-300 text-secondary-700'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                  >
                    {rule.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete rule"
                  >
                    <Trash size={20} weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">How it works:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• When multiple rules apply, the highest discount (longest duration) is used</li>
          <li>• Discounts are automatically applied at checkout</li>
          <li>• You can activate/deactivate rules without deleting them</li>
        </ul>
      </div>
    </div>
  );
}
