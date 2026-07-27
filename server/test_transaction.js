require("dotenv").config();
const { verifyTransaction } = require("./services/paymentService");

async function check() {
  try {
    const res = await verifyTransaction("KB-TX-1781130059713-499");
    console.log("CHAPA RESPONSE:", JSON.stringify(res, null, 2));
  } catch (error) {
    console.error("CHAPA ERROR:", error.message);
  }
}
check();
