export const ADMIN_TOPBAR_ACTION_EVENT = "ha-admin-topbar-action";

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: string;
  badge?: string;
  badgeType?: string;
}   

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { key: "overview", label: "Overview", to: "/admin", icon: "Home.svg" },
      {
        key: "analytics",
        label: "Analytics",
        to: "/admin/analytics",
        icon: "Analytic.svg",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        key: "salons",
        label: "Salons & Clinics",
        to: "/admin/salons",
        icon: "Shop.svg",
        badge: "3",
        badgeType: "amber",
      },
      {
        key: "customers",
        label: "Customers",
        to: "/admin/customers",
        icon: "Users.svg",
      },
      {
        key: "bookings",
        label: "All Bookings",
        to: "/admin/bookings",
        icon: "Calendar.svg",
        badge: "12",
        badgeType: "green",
      },
      {
        key: "reviews",
        label: "Reviews",
        to: "/admin/reviews",
        icon: "Star.svg",
        badge: "2",
        badgeType: "rose",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        key: "revenue",
        label: "Revenue & Commission",
        to: "/admin/revenue",
        icon: "Dollar.svg",
      },
      {
        key: "payouts",
        label: "Payouts",
        to: "/admin/payouts",
        icon: "Bank.svg",
        badge: "4",
        badgeType: "amber",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        key: "notifications",
        label: "Notifications",
        to: "/admin/notifications",
        icon: "Speaker.svg",
      },
      { key: "settings", label: "Settings", to: "/admin/settings", icon: "Gears.svg" },
    ],
  },
];
export const ownerNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        to: "/owner",
        icon: "Home.svg",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        key: "services",
        label: "Services",
        to: "/owner/services",
        icon: "Shop.svg",
      },
      {
        key: "staff",
        label: "Staff",
        to: "/owner/staff",
        icon: "Users.svg",
      },
      {
        key: "bookings",
        label: "Bookings",
        to: "/owner/bookings",
        icon: "Calendar.svg",
      },
      {
        key: "customers",
        label: "Customers",
        to: "/owner/customers",
        icon: "Users.svg",
      },
      {
        key: "reviews",
        label: "Reviews",
        to: "/owner/reviews",
        icon: "Star.svg",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        key: "revenue",
        label: "Revenue",
        to: "/owner/revenue",
        icon: "Dollar.svg",
      },
    ],
  },
];

export const customerNavGroups: NavGroup[] = [
  {
    label: "Explore",
    items: [
      {
        key: "salons",
        label: "Salons",
        to: "/customer/salons",
        icon: "Shop.svg",
      },
    ],
  },
  {
    label: "Bookings",
    items: [
      {
        key: "bookings",
        label: "My Bookings",
        to: "/customer/bookings",
        icon: "Calendar.svg",
      },
    ],
  },
];
export const pageMeta: Record<string, { title: string; sub: string; action: string }> =
  {
    overview: {
      title: "Platform Overview",
      sub: "Hermoso · Live Dashboard · Pakistan",
      action: "+ Add Salon",
    },
    analytics: {
      title: "Analytics",
      sub: "User growth, engagement & AI adoption",
      action: "Export Report",
    },
    salons: {
      title: "Salons & Clinics",
      sub: "Manage, approve & configure service providers",
      action: "+ Add Salon",
    },
    customers: {
      title: "Customer Management",
      sub: "All registered customers · platform wide",
      action: "Export CSV",
    },
    bookings: {
      title: "All Bookings",
      sub: "Live booking feed across all salons",
      action: "Export CSV",
    },
    reviews: {
      title: "Review Moderation",
      sub: "Approve, flag & manage platform reviews",
      action: "Moderate All",
    },
    revenue: {
      title: "Revenue & Commission",
      sub: "Platform earnings and commission rules",
      action: "Export Report",
    },
    payouts: {
      title: "Payout Management",
      sub: "Salon payouts · pending & processed",
      action: "Release All",
    },
    notifications: {
      title: "Push Notifications",
      sub: "Send targeted messages to customers & salons",
      action: "New Campaign",
    },
    settings: {
      title: "Platform Settings",
      sub: "Controls, access management & configuration",
      action: "Save Changes",
    },
    profile: {
      title: "Admin Profile",
      sub: "Account information and preferences",
      action: "Update Profile",
    },
  };