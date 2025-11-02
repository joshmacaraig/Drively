'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CarPricingRule } from '@/lib/types/database';
import { Percent, Tag } from '@phosphor-icons/react';
import { formatDiscountDescription } from '@/lib/utils/pricing';

interface DiscountBadgesProps {
  carId: string;
}

export default function DiscountBadges({ carId }: DiscountBadgesProps) {
  const [rules, setRules] = useState<CarPricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('car_pricing_rules')
          .select('*')
          .eq('car_id', carId)
          .eq('is_active', true)
          .order('min_days', { ascending: true });

        if (!error && data) {
          setRules(data);
        }
      } catch (err) {
        console.error('Error loading discount rules:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, [carId]);

  if (loading || rules.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-green-500 rounded-lg">
          <Tag size={24} weight="duotone" className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Percent size={20} weight="bold" />
            Special Discounts Available
          </h3>
          <div className="space-y-1">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 text-sm text-green-800">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{formatDiscountDescription(rule)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-700 mt-2">
            Save more when you book for longer periods!
          </p>
        </div>
      </div>
    </div>
  );
}
