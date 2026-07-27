const aiToolDeclarations = [
  {
    name: "searchTours",
    description: "Search the live database for available tours by destination, type, or duration.",
    parameters: {
      type: "OBJECT",
      properties: {
        destination: { type: "STRING", description: "The destination or region to search (e.g., Mount Hambarcho, Ajora Falls)" },
        type: { type: "STRING", description: "The type of tour (e.g., cultural, adventure, wellness)" },
      },
    },
  },
  {
    name: "searchPackages",
    description: "Search for multi-day travel packages.",
    parameters: {
      type: "OBJECT",
      properties: {
        theme: { type: "STRING", description: "The theme of the package (e.g., Heritage, Honeymoon)" },
      },
    },
  },
  {
    name: "searchHotels",
    description: "Search the database for partnered hotels in specific regions.",
    parameters: {
      type: "OBJECT",
      properties: {
        region: { type: "STRING", description: "The city or region to search for hotels." },
      },
    },
  },
  {
    name: "getTourSchedules",
    description: "Get the upcoming departure dates, remaining slots, and prices for a specific tour.",
    parameters: {
      type: "OBJECT",
      properties: {
        tourName: { type: "STRING", description: "The full name or partial name of the tour to get schedules for." },
      },
      required: ["tourName"],
    },
  },
  {
    name: "getPackageSchedules",
    description: "Get the upcoming departure dates and availability for a specific travel package.",
    parameters: {
      type: "OBJECT",
      properties: {
        packageName: { type: "STRING", description: "The full name or partial name of the package." },
      },
      required: ["packageName"],
    },
  },
  {
    name: "getHotelAvailability",
    description: "Check if a specific hotel has available rooms for given dates.",
    parameters: {
      type: "OBJECT",
      properties: {
        hotelName: { type: "STRING", description: "The name of the hotel." },
        startDate: { type: "STRING", description: "Check-in date (YYYY-MM-DD)" },
        endDate: { type: "STRING", description: "Check-out date (YYYY-MM-DD)" },
      },
      required: ["hotelName"],
    },
  },
  {
    name: "checkBookingStatus",
    description: "Look up the live status of any booking using its unique booking ID (e.g., KBT-1234).",
    parameters: {
      type: "OBJECT",
      properties: {
        bookingId: { type: "STRING", description: "The specific booking ID." },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "getTravelerBookings",
    description: "Retrieve all active bookings, invoices, and payment statuses for the currently logged-in user. DO NOT ask for user ID; it is provided automatically from the secure context.",
    parameters: {
      type: "OBJECT",
      properties: {
        filter: { type: "STRING", description: "Optional filter (e.g., 'upcoming', 'past', 'all'). Defaults to 'all'." },
      },
    },
  },
  {
    name: "getGuideAvailability",
    description: "Check if a specific tour guide is available for booking, or find available guides for a date.",
    parameters: {
      type: "OBJECT",
      properties: {
        guideName: { type: "STRING", description: "The name of the guide." },
        date: { type: "STRING", description: "The specific date to check (YYYY-MM-DD)." },
      },
    },
  },
  {
    name: "calculatePackagePrice",
    description: "Calculate the total cost of a package or tour based on the number of people and specific pricing rules.",
    parameters: {
      type: "OBJECT",
      properties: {
        itemName: { type: "STRING", description: "Name of the tour or package." },
        numPeople: { type: "NUMBER", description: "Number of travelers." },
      },
      required: ["itemName", "numPeople"],
    },
  },
  {
    name: "createCustomTourRequest",
    description: "Create a request for a custom private tour for the user. Use this when a user wants a personalized itinerary.",
    parameters: {
      type: "OBJECT",
      properties: {
        destination: { type: "STRING", description: "Desired destination." },
        numTravelers: { type: "NUMBER", description: "Number of travelers." },
        budgetRange: { type: "STRING", description: "Estimated budget." },
        specialRequests: { type: "STRING", description: "Any special requirements." },
      },
      required: ["destination", "numTravelers"],
    },
  }
];

module.exports = { aiToolDeclarations };
