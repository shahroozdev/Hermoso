/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-console */
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Salon } from '../models/Salon.js';
import { Category } from '../models/Category.js';
import { Service } from '../models/Service.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';
import { Payout } from '../models/Payout.js';
import { Notification } from '../models/Notification.js';
import { BookingStatus, ReviewStatus, Roles, SalonStatus } from '../utils/constants.js';
import {
  mockCategories,
  mockSalonNames,
  mockCities,
  mockAddresses,
  mockPhoneNumbers,
  mockOwnerNames,
  mockStaffNames,
  mockServiceNames,
  mockServiceDescriptions,
  mockDesignations,
  mockWorkingDays,
  mockShiftTimes,
  mockSalaryTypes,
  mockCustomerNames,
  mockReviewComments,
  mockSalonDescriptions,
  mockWorkingHours,
  mockServicePrices,
  mockServiceDurations,
  mockCommissionRates,
  mockEventNames,
  mockEventDescriptions,
  mockEventCategories
} from './mockData.js';

dotenv.config();

// Helper functions
const getRandomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const getRandomItems = <T,>(array: T[], min: number, max: number): T[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const generateUniqueEmails = (baseName: string, index: number) => {
  const timestamp = Date.now();
  return `${baseName.toLowerCase().replace(/\s+/g, '.')}.${index}.${timestamp}@hermoso.app`;
};

const seed = async () => {
  await connectDB();

  console.log('🧹 Clearing database...');
  await Promise.all([
    User.deleteMany({}),
    Salon.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Payout.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('👤 Creating admin users...');
  const superAdmin = await User.create({
    name: 'Platform Admin',
    email: 'admin@hermoso.app',
    password: 'Admin@123',
    role: Roles.SUPER_ADMIN
  });

  console.log('📚 Creating categories...');
  const categories = await Category.insertMany(
    mockCategories.map(name => ({ name, active: true }))
  );

  console.log('🏢 Creating 100 salons with owners, staff, services, bookings, reviews...');
  const owners: any[] = [];
  const salons: any[] = [];
  const allStaff: any[] = [];
  const allServices: any[] = [];
  const customers: any[] = [];

  // Create 50 customers first
  for (let i = 0; i < 50; i++) {
    const customer = await User.create({
      name: mockCustomerNames[i % mockCustomerNames.length],
      email: generateUniqueEmails(`customer${i}`, i),
      password: 'Customer@123',
      role: Roles.CUSTOMER,
      location: {
        city: getRandomItem(mockCities),
        country: 'Pakistan'
      }
    });
    customers.push(customer);
  }

  // Create 100 salons
  for (let salonIndex = 0; salonIndex < 100; salonIndex++) {
    const salonName = mockSalonNames[salonIndex % mockSalonNames.length];
    const city = getRandomItem(mockCities);

    // Create owner for salon
    const owner = await User.create({
      name: mockOwnerNames[salonIndex % mockOwnerNames.length],
      email: generateUniqueEmails(`owner${salonIndex}`, salonIndex),
      password: 'Owner@123',
      role: Roles.SALON_OWNER,
      phone: mockPhoneNumbers[salonIndex % mockPhoneNumbers.length],
      location: {
        city: city,
        country: 'Pakistan'
      }
    });
    owners.push(owner);

    // Create salon
    const salon = await Salon.create({
      name: `${salonName} ${salonIndex + 1}`,
      ownerId: owner._id,
      description: getRandomItem(mockSalonDescriptions),
      address: getRandomItem(mockAddresses).replace('{city}', city),
      phone: mockPhoneNumbers[(salonIndex + 1) % mockPhoneNumbers.length],
      images: [],
      workingHours: mockWorkingHours,
      commissionRate: getRandomItem(mockCommissionRates),
      status: getRandomItem([SalonStatus.APPROVED, SalonStatus.APPROVED, SalonStatus.PENDING]),
      verified: Math.random() > 0.3,
      location: {
        city: city,
        country: 'Pakistan'
      }
    });
    salons.push(salon);

    // Update owner with salonId
    owner.salonId = salon._id as any;
    await owner.save();

    // Create 5-15 services per salon
    const salonServiceCount = Math.floor(Math.random() * 11) + 5;
    const salonServices = getRandomItems(mockServiceNames, salonServiceCount, salonServiceCount);

    for (let serviceIndex = 0; serviceIndex < salonServices.length; serviceIndex++) {
      const serviceName = salonServices[serviceIndex];
      const category = getRandomItem(categories);
      const service = await Service.create({
        salonId: salon._id,
        name: `${serviceName} - Salon${salonIndex} - S${serviceIndex}`,
        description: getRandomItem(mockServiceDescriptions),
        price: getRandomItem(mockServicePrices),
        duration: getRandomItem(mockServiceDurations),
        categoryId: category._id,
        category: category.name,
        active: true
      });
      allServices.push(service);
    }

    // Get salon services for staff assignment
    const salonServices_db = await Service.find({ salonId: salon._id });

    // Create 3-6 events per salon
    const eventCount = Math.floor(Math.random() * 4) + 3;
    for (let eventIndex = 0; eventIndex < eventCount; eventIndex++) {
      const eventName = mockEventNames[eventIndex % mockEventNames.length];
      const eventCategory = mockEventCategories[eventIndex % mockEventCategories.length];

      // Select 2-5 random services for the event
      const eventServices = getRandomItems(salonServices_db, 2, Math.min(5, salonServices_db.length));

      const totalPrice = eventServices.reduce((sum, s) => sum + s.price, 0);
      const totalDuration = eventServices.reduce((sum, s) => sum + s.duration, 0);
      const discount = [0, 5, 10, 15, 20][Math.floor(Math.random() * 5)];
      const finalPrice = totalPrice - (totalPrice * discount / 100);

      await Event.create({
        salonId: salon._id,
        name: `${eventName} - ${salon.name}`,
        description: getRandomItem(mockEventDescriptions),
        category: eventCategory,
        services: eventServices.map(service => ({
          serviceId: service._id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration
        })),
        totalPrice,
        totalDuration,
        discount,
        finalPrice,
        active: true,
        images: []
      });
    }

    // Create 3-8 staff members per salon
    const staffCount = Math.floor(Math.random() * 6) + 3;
    for (let staffIndex = 0; staffIndex < staffCount; staffIndex++) {
      const staffServices = getRandomItems(salonServices_db, 1, Math.min(5, salonServices_db.length));

      const staff = await User.create({
        salonId: salon._id,
        name: mockStaffNames[(salonIndex * staffCount + staffIndex) % mockStaffNames.length],
        email: generateUniqueEmails(`staff${salonIndex}${staffIndex}`, salonIndex * 100 + staffIndex),
        password: 'Staff@123',
        role: Roles.STAFF,
        phone: mockPhoneNumbers[(salonIndex + staffIndex) % mockPhoneNumbers.length],
        staffDetails: {
          designation: getRandomItem(mockDesignations),
          salary: Math.floor(Math.random() * 30000) + 15000,
          salaryType: getRandomItem(mockSalaryTypes),
          joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          shiftStartTime: getRandomItem(mockShiftTimes).start,
          shiftEndTime: getRandomItem(mockShiftTimes).end,
          workingDays: getRandomItem(mockWorkingDays),
          commissionPercentage: Math.floor(Math.random() * 20),
          emergencyContact: mockPhoneNumbers[(salonIndex + staffIndex + 1) % mockPhoneNumbers.length],
          services: staffServices.map((s: any) => s._id)
        }
      });
      allStaff.push(staff);
    }

    // Create 10-30 bookings per salon
    const bookingCount = Math.floor(Math.random() * 21) + 10;
    for (let bookingIndex = 0; bookingIndex < bookingCount; bookingIndex++) {
      const customer = getRandomItem(customers);
      const staff = getRandomItem(allStaff.filter((s: any) => s.salonId.toString() === salon._id.toString()));
      const staffServiceIds = staff?.staffDetails?.services || [];

      let serviceToBook = salonServices_db[0];
      if (staffServiceIds.length > 0) {
        serviceToBook = salonServices_db.find((s: any) =>
          staffServiceIds.some((sid: any) => sid.toString() === s._id.toString())
        ) || salonServices_db[0];
      }

      const bookingDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const bookingHour = Math.floor(Math.random() * 10) + 9;
      const bookingMinute = [0, 30][Math.floor(Math.random() * 2)];

      const booking = await Booking.create({
        customerId: customer._id,
        salonId: salon._id,
        serviceId: serviceToBook._id,
        staffId: staff._id,
        bookingDate: bookingDate,
        bookingTime: `${String(bookingHour).padStart(2, '0')}:${String(bookingMinute).padStart(2, '0')}`,
        status: getRandomItem(Object.values(BookingStatus)),
        price: serviceToBook.price
      });

      // Create payment for confirmed/completed bookings
      if ([BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(booking.status as any)) {
        const platformCommission = Math.floor(booking.price * salon.commissionRate / 100);
        await Payment.create({
          bookingId: booking._id,
          salonId: salon._id,
          amount: booking.price,
          platformCommission: platformCommission,
          salonAmount: booking.price - platformCommission,
          status: 'paid'
        });
      }

      // Create reviews for completed bookings
      if (booking.status === BookingStatus.COMPLETED && Math.random() > 0.4) {
        await Review.create({
          salonId: salon._id,
          customerId: customer._id,
          rating: Math.floor(Math.random() * 3) + 3,
          comment: getRandomItem(mockReviewComments),
          status: ReviewStatus.APPROVED
        });
      }
    }

    // Create payouts
    if (Math.random() > 0.5) {
      await Payout.create({
        salonId: salon._id,
        amount: Math.floor(Math.random() * 10000) + 5000,
        status: getRandomItem(['pending', 'completed', 'failed']),
        payoutDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Create notification
    await Notification.create({
      title: 'Welcome to Hermoso',
      message: `Your salon ${salon.name} account is ${salon.status}.`,
      type: 'system',
      targetRole: Roles.SALON_OWNER,
      salonId: salon._id,
      userId: owner._id
    });

    if ((salonIndex + 1) % 10 === 0) {
      console.log(`✅ Seeded ${salonIndex + 1}/100 salons...`);
    }
  }

  console.log('📊 Seed Summary:');
  console.log(`✅ Super Admin: 1`);
  console.log(`✅ Salon Owners: ${owners.length}`);
  console.log(`✅ Salons: ${salons.length}`);
  console.log(`✅ Categories: ${categories.length}`);
  console.log(`✅ Services: ${allServices.length}`);
  console.log(`✅ Events: ${await Event.countDocuments()}`);
  console.log(`✅ Staff Members: ${allStaff.length}`);
  console.log(`✅ Customers: ${customers.length}`);
  console.log(`✅ Bookings: ${await Booking.countDocuments()}`);
  console.log(`✅ Payments: ${await Payment.countDocuments()}`);
  console.log(`✅ Reviews: ${await Review.countDocuments()}`);
  console.log('🎉 Seed completed successfully!');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
