const reservationService = require("../services/reservationService");

const startExpiryJob = () => {
  const interval = setInterval(async () => {
    try {
      const expiredCount = await reservationService.expireReservations();

      if (expiredCount > 0) {
        console.log(`${expiredCount} reservations expired`);
      }
    } catch (error) {
      console.error("Reservation expiry error:", error.message);
    }
  }, 30000);

  return interval;
};

module.exports = startExpiryJob;