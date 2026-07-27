const PDFDocument = require("pdfkit");

const tourTitle = (t) => t?.title?.en || t?.title || "Tour";

/**
 * Build a PDF invoice buffer from traveler invoice payload.
 */
const generateInvoicePdf = (invoice) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const { invoiceNumber, issuedAt, customer, type, record, platform } = invoice;

      doc.fontSize(22).fillColor("#1A331B").text(platform || "Kambata Travel", { align: "left" });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#64748B").text("Official Booking Invoice");
      doc.moveDown(1.5);

      doc.fontSize(11).fillColor("#0F172A");
      doc.text(`Invoice #: ${invoiceNumber}`);
      doc.text(`Date: ${new Date(issuedAt).toLocaleDateString()}`);
      doc.text(`Type: ${String(type).toUpperCase()}`);
      doc.moveDown();

      doc.fontSize(12).fillColor("#1A331B").text("Bill To");
      doc.fontSize(10).fillColor("#334155");
      doc.text(customer?.name || "Traveler");
      doc.text(customer?.email || "");
      doc.moveDown(1.2);

      doc.fontSize(12).fillColor("#1A331B").text("Booking Details");
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#334155");

      if (type === "tour" && record?.tour) {
        doc.text(`Tour: ${tourTitle(record.tour)}`);
        doc.text(`Status: ${record.status}`);
        doc.text(`Payment: ${record.paymentStatus || "—"}`);
        doc.text(`Travelers: ${record.numPeople || 1}`);
        if (record.guide?.name) doc.text(`Guide: ${record.guide.name}`);
      } else if (type === "package") {
        const tour = record.packageId?.tour;
        const hotel = record.packageId?.hotel;
        if (tour) doc.text(`Tour: ${tourTitle(tour)}`);
        if (hotel) doc.text(`Hotel: ${hotel.name}`);
        doc.text(`Status: ${record.bookingStatus}`);
      }

      doc.moveDown(1.5);
      doc.fontSize(14).fillColor("#1A331B").text(
        `Total: ETB ${Number(record?.totalPrice || 0).toLocaleString()}`,
        { align: "right" }
      );

      doc.moveDown(3);
      doc.fontSize(9).fillColor("#94A3B8").text(
        "Thank you for traveling with Kambata Travel. For support, contact support@kambata.travel.",
        { align: "center" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generateInvoicePdf };
