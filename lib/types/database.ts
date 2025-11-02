// Database Types for Drively
export type UserRole = 'admin' | 'renter' | 'car_owner';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type RentalStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type ChecklistType = 'pickup' | 'return';

export type PricingRuleType = 'duration_discount';

export type DiscountType = 'percentage' | 'fixed';

export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string;
  active_role: UserRole;
  roles: UserRole[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationDocument {
  id: string;
  user_id: string;
  philsys_id_url?: string;
  proof_of_address_url?: string;
  drivers_license_url?: string;
  status: VerificationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
  created_at: string;
}

export interface Car {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  color?: string;
  transmission?: 'automatic' | 'manual';
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats?: number;
  daily_rate: number;
  is_active: boolean;
  location?: string;
  description?: string;
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface CarImage {
  id: string;
  car_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface Rental {
  id: string;
  car_id: string;
  renter_id: string;
  owner_id: string;
  start_datetime: string;
  end_datetime: string;
  status: RentalStatus;
  total_amount: number;
  pickup_location?: string;
  return_location?: string;
  pickup_checklist_completed: boolean;
  return_checklist_completed: boolean;
  pickup_completed_at?: string;
  return_completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  type: ChecklistType;
  items: ChecklistItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: number;
  category: string;
  item: string;
  requires_photo?: boolean;
  requires_input?: string;
}

export interface RentalChecklist {
  id: string;
  rental_id: string;
  type: ChecklistType;
  template_id?: string;
  items: any; // JSONB
  completed_by?: string;
  completed_at?: string;
  photos?: string[];
  notes?: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  car_id: string;
  maintenance_type: string;
  description?: string;
  cost?: number;
  performed_date: string;
  next_maintenance_date?: string;
  odometer_reading?: number;
  performed_by?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  rental_id?: string;
  maintenance_id?: string;
  reminder_type: 'pickup' | 'return' | 'maintenance' | 'verification';
  reminder_date: string;
  message: string;
  is_sent: boolean;
  sent_at?: string;
  created_at: string;
}

export interface CarPricingRule {
  id: string;
  car_id: string;
  rule_type: PricingRuleType;
  min_days: number;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Computed types with relations
export interface CarWithImages extends Car {
  images: CarImage[];
  owner: Profile;
  rentals?: Rental[];
  pricing_rules?: CarPricingRule[];
}

export interface RentalWithDetails extends Rental {
  car: CarWithImages;
  renter: Profile;
  owner: Profile;
}

export interface VerificationWithUser extends VerificationDocument {
  user: Profile;
  reviewer?: Profile;
}
