const Tour = require('../../models/Tour');
const Package = require('../../models/Package');
const Hotel = require('../../models/Hotel');
const Booking = require('../../models/Booking');
const PackageBooking = require('../../models/PackageBooking');
const Guide = require('../../models/Guide');
const TourRequest = require('../../models/TourRequest');

const toolExecutors = {
  searchTours: async ({ destination, type }) => {
    let query = { isPublished: true };
    if (type) query.category = { $regex: type, $options: 'i' };
    
    let tours = await Tour.find(query)
      .populate('destination')
      .select('title description price duration difficulty maxCapacity destination category')
      .lean();
      
    if (destination) {
      const destRegex = new RegExp(destination, 'i');
      tours = tours.filter(t => 
        (t.destination?.name?.en?.match(destRegex)) ||
        (t.destination?.location?.woreda?.match(destRegex))
      );
    }
    
    if (!tours.length) return { message: "No tours found matching the criteria." };
    
    return tours.map(t => ({
      title: t.title?.en,
      description: t.description?.en,
      price: t.price,
      duration: `${t.duration?.value} ${t.duration?.unit}`,
      difficulty: t.difficulty,
      maxCapacity: t.maxCapacity,
      destination: t.destination?.name?.en
    }));
  },

  searchPackages: async ({ theme }) => {
    let query = { status: 'active' };
    
    let packages = await Package.find(query)
      .populate('tour', 'title')
      .populate('hotel', 'name location')
      .select('name description basePrice duration includedServices tour hotel').lean();
      
    if (theme) {
       const themeRegex = new RegExp(theme, 'i');
       packages = packages.filter(p => p.name?.en?.match(themeRegex) || p.description?.en?.match(themeRegex));
    }
    
    if (!packages.length) return { message: "No packages found matching the criteria." };
    
    return packages.map(p => ({
      name: p.name?.en,
      description: p.description?.en,
      price: p.basePrice,
      duration: `${p.duration?.value} ${p.duration?.unit}`,
      tour: p.tour?.title?.en,
      hotel: p.hotel?.name
    }));
  },

  searchHotels: async ({ region }) => {
    let query = { status: 'active' };
    
    // Check if the user specified a specific city like Durame or Shinshcho
    // If they just said "Kambata Zone" we return all active hotels
    if (region && !region.toLowerCase().includes("kambata")) {
      query.location = { $regex: region, $options: 'i' };
    }
    
    const hotels = await Hotel.find(query).select('name description location rating roomTypes amenities contactNumber').lean();
    
    if (!hotels.length) return { message: "No hotels found matching that region." };

    // Format for AI consumption so it doesn't get confused by complex nested arrays
    return hotels.map(h => ({
      name: h.name,
      location: h.location,
      description: h.description,
      amenities: h.amenities,
      averageRating: h.rating?.average,
      contact: h.contactNumber,
      roomOptions: h.roomTypes?.map(rt => `${rt.name} - $${rt.pricePerNight}/night`) || []
    }));
  },

  getTourSchedules: async ({ tourName }) => {
    const tour = await Tour.findOne({ 'title.en': { $regex: tourName, $options: 'i' } }).lean();
    if (!tour) return { message: `Tour '${tourName}' not found.` };
    
    const now = new Date();
    const upcomingSchedules = tour.schedules.filter(s => new Date(s.startDate) >= now && s.status === 'published');
    
    return {
      tourId: tour._id,
      title: tour.title.en,
      price: tour.price,
      upcomingSchedules: upcomingSchedules.map(s => ({
        startDate: s.startDate,
        endDate: s.endDate,
        remainingSlots: s.remainingSlots,
      }))
    };
  },

  getPackageSchedules: async ({ packageName }) => {
    const pkg = await Package.findOne({ 'name.en': { $regex: packageName, $options: 'i' } }).lean();
    if (!pkg) return { message: `Package '${packageName}' not found.` };
    
    const now = new Date();
    const upcomingSchedules = pkg.schedules.filter(s => new Date(s.startDate) >= now && s.status === 'published');
    
    return {
      packageId: pkg._id,
      name: pkg.name.en,
      price: pkg.basePrice,
      upcomingSchedules: upcomingSchedules.map(s => ({
        startDate: s.startDate,
        endDate: s.endDate,
        remainingSlots: s.remainingSlots,
      }))
    };
  },

  getHotelAvailability: async ({ hotelName, startDate, endDate }) => {
    // Basic check for now
    const hotel = await Hotel.findOne({ name: { $regex: hotelName, $options: 'i' } }).lean();
    if (!hotel) return { message: `Hotel '${hotelName}' not found.` };
    return {
      hotel: hotel.name,
      basePricePerNight: hotel.basePricePerNight,
      status: "Available",
      message: `Rooms are generally available. Proceed to booking for precise room allocation.`
    };
  },

  checkBookingStatus: async ({ bookingId }) => {
    let booking = await Booking.findOne({ referenceNumber: bookingId }).populate('tour', 'title').lean();
    if (booking) {
      return { type: "Tour Booking", bookingId, status: booking.status, paymentStatus: booking.paymentStatus, tour: booking.tour?.title?.en };
    }
    
    let pkgBooking = await PackageBooking.findOne({ referenceNumber: bookingId }).populate('package', 'name').lean();
    if (pkgBooking) {
      return { type: "Package Booking", bookingId, status: pkgBooking.bookingStatus, paymentStatus: pkgBooking.paymentStatus, package: pkgBooking.package?.name?.en };
    }
    
    return { message: `Booking ID '${bookingId}' not found.` };
  },

  getTravelerBookings: async ({ filter }, userId) => {
    if (!userId) return { message: "User is not authenticated. Please log in to view your bookings." };
    
    const tourBookings = await Booking.find({ user: userId }).populate('tour', 'title price').lean();
    const pkgBookings = await PackageBooking.find({ user: userId }).populate('package', 'name basePrice').lean();
    
    return {
      tourBookings: tourBookings.map(b => ({ bookingId: b.referenceNumber, tour: b.tour?.title?.en, status: b.status, paymentStatus: b.paymentStatus, amount: b.totalPrice })),
      packageBookings: pkgBookings.map(b => ({ bookingId: b.referenceNumber, package: b.package?.name?.en, status: b.bookingStatus, paymentStatus: b.paymentStatus, amount: b.totalPrice }))
    };
  },

  getGuideAvailability: async ({ guideName, date }) => {
    const guide = await Guide.findOne({ user: { $exists: true } }).populate('user', 'name').lean(); 
    // This is a simplified check. A full check would search the Guide's actual calendar.
    return {
      message: `Please use the booking system to assign a specific guide. The AI currently provides general information only.`
    };
  },

  calculatePackagePrice: async ({ itemName, numPeople }) => {
    const tour = await Tour.findOne({ 'title.en': { $regex: itemName, $options: 'i' } }).lean();
    if (tour) return { itemName: tour.title.en, unitPrice: tour.price, numPeople, totalPrice: tour.price * numPeople };
    
    const pkg = await Package.findOne({ 'name.en': { $regex: itemName, $options: 'i' } }).lean();
    if (pkg) return { itemName: pkg.name.en, unitPrice: pkg.basePrice, numPeople, totalPrice: pkg.basePrice * numPeople };
    
    return { message: `Item '${itemName}' not found. Cannot calculate price.` };
  },

  createCustomTourRequest: async ({ destination, numTravelers, budgetRange, specialRequests }, userId) => {
    if (!userId) return { message: "You must be logged in to create a custom tour request." };
    
    const newRequest = await TourRequest.create({
      user: userId,
      destinations: [destination],
      numPeople: numTravelers,
      budget: budgetRange ? parseInt(budgetRange) : 0,
      specialRequirements: specialRequests,
      status: 'pending'
    });
    
    return {
      message: "Custom tour request created successfully! A curator will review it shortly.",
      requestId: newRequest._id
    };
  }
};

module.exports = { toolExecutors };
