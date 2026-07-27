process.env.NODE_ENV = 'development';
const mongoose = require('mongoose');
const { verifyTransaction } = require('./services/paymentService');
const { confirmPaidBooking } = require('./services/bookingConfirmService');
const Transaction = require('./models/Transaction');

mongoose.connect('mongodb://localhost:27017/kambata-travel').then(async () => {
  const tx_ref = 'PKG-TX-1784336648690-317'; // The new one that failed

  try {
    const transaction = await Transaction.findOne({ tx_ref });
    console.log("Transaction found:", !!transaction);

    // 1. Chapa verify
    console.log("Calling verifyTransaction...");
    const verificationData = await verifyTransaction(tx_ref);
    console.log("verificationData:", verificationData);
    
    // 2. confirmPaidBooking
    // Let's resolve the booking
    const resolveBooking = async (tx_ref) => {
      const PackageBooking = require('./models/PackageBooking');
      const pkgFallback = await PackageBooking.findOne({ tx_ref });
      if (pkgFallback) return { booking: pkgFallback, isPackage: true };
      return { booking: null, isPackage: false };
    };
    
    const { booking } = await resolveBooking(tx_ref);
    console.log("Booking found:", !!booking);
    
    if (booking) {
      console.log("Calling confirmPaidBooking...");
      await confirmPaidBooking(booking);
      console.log("confirmPaidBooking succeeded!");
    }

  } catch (error) {
    console.error("DEBUG ERROR:", error);
  } finally {
    process.exit(0);
  }
});
