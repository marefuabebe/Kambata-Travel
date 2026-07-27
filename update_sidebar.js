const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');
const layoutPath = path.join(__dirname, 'frontend/src/app/explorer-dashboard/layout.tsx');

let enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let amLocale = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enLocale.sidebar = {
  dashboard: "Dashboard",
  exploreTours: "Explore Tours",
  explorePackages: "Explore Packages",
  myBookings: "My Bookings",
  myRequests: "My Requests",
  payments: "Payments",
  messages: "Messages",
  notifications: "Notifications",
  wishlist: "Wishlist",
  reviews: "Reviews",
  profile: "Profile",
  sosEmergency: "SOS Emergency",
  searchPlaceholder: "Search destinations, tours, or guides..."
};

amLocale.sidebar = {
  dashboard: "ዳሽቦርድ",
  exploreTours: "ጉብኝቶችን ያስሱ",
  explorePackages: "ጥቅሎችን ያስሱ",
  myBookings: "የእኔ ቦታ ማስያዣዎች",
  myRequests: "የእኔ ጥያቄዎች",
  payments: "ክፍያዎች",
  messages: "መልእክቶች",
  notifications: "ማሳወቂያዎች",
  wishlist: "የምኞት ዝርዝር",
  reviews: "ግምገማዎች",
  profile: "መገለጫ",
  sosEmergency: "የኤስኦኤስ ድንገተኛ አደጋ",
  searchPlaceholder: "መዳረሻዎችን፣ ጉብኝቶችን ወይም አስጎብኚዎችን ይፈልጉ..."
};

fs.writeFileSync(enPath, JSON.stringify(enLocale, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amLocale, null, 2), 'utf8');

let layoutContent = fs.readFileSync(layoutPath, 'utf8');

const oldNav = `const NAV = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/explorer-dashboard" },
  { name: "Explore Tours", icon: Compass, path: "/explorer-dashboard/explore-tours" },
  { name: "Explore Packages", icon: Package, path: "/explorer-dashboard/packages" },
  { name: "My Bookings", icon: CalendarCheck, path: "/explorer-dashboard/bookings" },
  { name: "My Requests", icon: CalendarCheck, path: "/explorer-dashboard/my-requests" },
  { name: "Payments", icon: CreditCard, path: "/explorer-dashboard/payments" },
  { name: "Messages", icon: MessageSquare, path: "/explorer-dashboard/messages" },
  { name: "Notifications", icon: Bell, path: "/explorer-dashboard/notifications" },
  { name: "Wishlist", icon: Heart, path: "/explorer-dashboard/wishlist" },
  { name: "Reviews", icon: Star, path: "/explorer-dashboard/reviews" },
  { name: "Profile", icon: User, path: "/explorer-dashboard/settings" },
  { name: "SOS Emergency", icon: Siren, path: "/explorer-dashboard/sos", sos: true },
];`;

const newNav = `const getNav = (t: any) => [
  { name: t("sidebar.dashboard"), icon: LayoutDashboard, path: "/explorer-dashboard" },
  { name: t("sidebar.exploreTours"), icon: Compass, path: "/explorer-dashboard/explore-tours" },
  { name: t("sidebar.explorePackages"), icon: Package, path: "/explorer-dashboard/packages" },
  { name: t("sidebar.myBookings"), icon: CalendarCheck, path: "/explorer-dashboard/bookings" },
  { name: t("sidebar.myRequests"), icon: CalendarCheck, path: "/explorer-dashboard/my-requests" },
  { name: t("sidebar.payments"), icon: CreditCard, path: "/explorer-dashboard/payments" },
  { name: t("sidebar.messages"), icon: MessageSquare, path: "/explorer-dashboard/messages" },
  { name: t("sidebar.notifications"), icon: Bell, path: "/explorer-dashboard/notifications" },
  { name: t("sidebar.wishlist"), icon: Heart, path: "/explorer-dashboard/wishlist" },
  { name: t("sidebar.reviews"), icon: Star, path: "/explorer-dashboard/reviews" },
  { name: t("sidebar.profile"), icon: User, path: "/explorer-dashboard/settings" },
  { name: t("sidebar.sosEmergency"), icon: Siren, path: "/explorer-dashboard/sos", sos: true },
];`;

layoutContent = layoutContent.replace(oldNav, newNav);

layoutContent = layoutContent.replace('navItems={NAV}', 'navItems={getNav(t)}');
layoutContent = layoutContent.replace('const { t } = useLanguage();', ''); // ensure no double injection

// In case t is not in layout.tsx, let's inject it inside ExplorerDashboardLayout
const match = layoutContent.match(/export default function ExplorerDashboardLayout\([^)]*\)\s*\{/);
if (match && !layoutContent.includes('const { t } = useLanguage();')) {
  layoutContent = layoutContent.replace(match[0], match[0] + '\n  const { t } = useLanguage();');
}

// Replace Search Placeholder
layoutContent = layoutContent.replace(
  'placeholder="Search destinations, tours, or guides..."',
  'placeholder={t("sidebar.searchPlaceholder")}'
);

// Replace getPageTitle strings
layoutContent = layoutContent.replace(/return "Explore Tours";/g, 'return t("sidebar.exploreTours");');
layoutContent = layoutContent.replace(/return "Explore Packages";/g, 'return t("sidebar.explorePackages");');
layoutContent = layoutContent.replace(/return "My Bookings";/g, 'return t("sidebar.myBookings");');
layoutContent = layoutContent.replace(/return "My Requests";/g, 'return t("sidebar.myRequests");');
layoutContent = layoutContent.replace(/return "Payments";/g, 'return t("sidebar.payments");');
layoutContent = layoutContent.replace(/return "Messages";/g, 'return t("sidebar.messages");');
layoutContent = layoutContent.replace(/return "Notifications";/g, 'return t("sidebar.notifications");');
layoutContent = layoutContent.replace(/return "Wishlist";/g, 'return t("sidebar.wishlist");');
layoutContent = layoutContent.replace(/return "Reviews";/g, 'return t("sidebar.reviews");');
layoutContent = layoutContent.replace(/return "Settings";/g, 'return t("sidebar.profile");');
layoutContent = layoutContent.replace(/return "Support";/g, 'return t("support.title");'); // if available

fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log("Sidebar translation applied.");
