export interface Booking {
  _id: string;
  customerId: Customer;
  salonId: Salon;
  serviceId: Service;
  staffId: Staff;
  bookingDate: string; // ISO date string
  bookingTime: string; // e.g. "14:30"
  status: "pending" | "confirmed" | "completed" | "cancelled";
  priceInPaisa: number;
  notes: string;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
}

export interface Salon {
  _id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
}

export interface Service {
  _id: string;
  name: string;
  priceInPaisa: number;
  duration: number;
}

export interface Staff {
  _id: string;
  name: string;
  role: string;
}