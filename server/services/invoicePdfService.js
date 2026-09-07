const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

/**
 * Format string helpers
 */
const tourTitle = (t) => {
  if (!t) return "Kambata Expedition & Tour";
  if (typeof t === "string") return t;
  return t.title?.en || t.title || t.name?.en || t.name || "Kambata Tour";
};

const hotelName = (h) => {
  if (!h) return null;
  if (typeof h === "string") return h;
  return h.name?.en || h.name || "Partner Hotel";
};

/**
 * Build a luxury, publication-grade PDF invoice & digital pass buffer from traveler invoice payload.
 * Single-page A4 format with rich branding, structured tables, and verification QR code.
 */
const generateInvoicePdf = async (invoice) => {
  const {
    invoiceNumber = `INV-${Date.now()}`,
    issuedAt = new Date(),
    customer = {},
    type = "tour",
    record = {},
    platform = "Kambata Travel",
  } = invoice;

  // 1. Resolve extracted metadata
  const isPackage = type === "package";
  const customerName = customer?.name || record?.user?.name || "Valued Traveler";
  const customerEmail = customer?.email || record?.user?.email || "traveler@kambata.travel";
  const customerPhone = customer?.phone || record?.user?.phone || "";

  const packageRef = record?.packageId || {};
  const tourRef = isPackage ? (packageRef?.tour || {}) : (record?.tour || {});
  const hotelRef = isPackage ? (packageRef?.hotel || record?.hotel || {}) : (record?.hotel || null);

  const mainExpTitle = isPackage
    ? (packageRef?.name?.en || packageRef?.name || (tourRef ? tourTitle(tourRef) : "Kambata Heritage Package"))
    : tourTitle(tourRef);

  const destination =
    tourRef?.destination ||
    packageRef?.destination ||
    "Kambata Zone & Southern Ethiopia";

  const assignedGuide =
    record?.guide?.name ||
    record?.packageScheduleId?.assignedGuide?.name ||
    "Licensed Local Eco-Guide";

  const rawBookingStatus = record?.status || record?.bookingStatus || "confirmed";
  const rawPaymentStatus = record?.paymentStatus || "paid";
  const bookingStatus = String(rawBookingStatus).toUpperCase();
  const paymentStatus = String(rawPaymentStatus).toUpperCase();

  const travelersCount =
    record?.travelersCount ||
    record?.numPeople ||
    (Array.isArray(record?.travelers) && record?.travelers?.length ? record.travelers.length : 1);

  const totalPrice = Number(record?.totalPrice || 0);
  const subtotal = totalPrice > 0 ? (totalPrice / 1.15).toFixed(2) : "0.00";
  const vatAmount = totalPrice > 0 ? (totalPrice - Number(subtotal)).toFixed(2) : "0.00";

  // 2. Generate Verification QR Code Buffer
  let qrBuffer = null;
  try {
    const qrData = `https://kambata.travel/verify-pass?ref=${encodeURIComponent(invoiceNumber)}&status=${encodeURIComponent(bookingStatus)}`;
    qrBuffer = await QRCode.toBuffer(qrData, {
      width: 160,
      margin: 1,
      color: {
        dark: "#0A251D",
        light: "#FFFFFF",
      },
    });
  } catch (qrErr) {
    console.warn("QR code generation failed, proceeding without QR:", qrErr.message);
  }

  // 3. Render PDF with PDFKit
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        autoFirstPage: true,
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PAGE_WIDTH = 595.28;
      const MARGIN = 40;
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 515.28

      // --- 1. TOP BRAND ACCENT BAR ---
      doc.rect(0, 0, PAGE_WIDTH, 5).fill("#E5A93C");

      // --- 2. HEADER BANNER (Deep Forest Emerald) ---
      doc.rect(0, 5, PAGE_WIDTH, 105).fill("#0A251D");

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#34D399")
        .text("EXPLORE ETHIOPIA  •  OFFICIAL TRAVEL VOUCHER & EXPEDITION PASS", MARGIN, 24);

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#FFFFFF")
        .text(platform || "KAMBATA TRAVEL", MARGIN, 38);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#A7F3D0")
        .text("Premier Heritage, Eco-Tours & Cultural Packages", MARGIN, 68);

      // Status Pill Badge (Top Right)
      const badgeWidth = 145;
      const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;
      doc.roundedRect(badgeX, 24, badgeWidth, 22, 11).fill("#064E3B");
      doc.roundedRect(badgeX, 24, badgeWidth, 22, 11).lineWidth(1).stroke("#10B981");
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#34D399")
        .text(`● ${paymentStatus} & ${bookingStatus}`, badgeX, 30.5, {
          width: badgeWidth,
          align: "center",
        });

      // Invoice Number & Date
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#FFFFFF")
        .text(`REF: ${invoiceNumber}`, badgeX - 35, 56, {
          width: badgeWidth + 35,
          align: "right",
        });

      const displayDate = new Date(issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#94A3B8")
        .text(`Issued: ${displayDate}`, badgeX - 35, 72, {
          width: badgeWidth + 35,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6EE7B7")
        .text(`Type: ${String(type).toUpperCase()} BOOKING`, badgeX - 35, 86, {
          width: badgeWidth + 35,
          align: "right",
        });

      // --- 3. TWO-COLUMN SUMMARY CARDS (y = 125, height = 88) ---
      const cardY = 125;
      const cardW = (CONTENT_WIDTH - 15) / 2; // ~250
      const cardH = 88;

      // Card 1: Bill To / Traveler Details
      doc.roundedRect(MARGIN, cardY, cardW, cardH, 6).fill("#F8FAFC");
      doc.roundedRect(MARGIN, cardY, cardW, cardH, 6).lineWidth(1).stroke("#E2E8F0");
      doc.rect(MARGIN, cardY, cardW, 20).fill("#F1F5F9");
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#475569")
        .text("TRAVELER / BILLED TO", MARGIN + 10, cardY + 6);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text(customerName, MARGIN + 10, cardY + 28);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text(customerEmail, MARGIN + 10, cardY + 44);

      const travelerInfo = customerPhone
        ? `Phone: ${customerPhone} • ${travelersCount} Guest(s)`
        : `Party: ${travelersCount} Traveler(s) • Direct Booking`;

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text(travelerInfo, MARGIN + 10, cardY + 58);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#059669")
        .text("Verified Identity Account", MARGIN + 10, cardY + 72);

      // Card 2: Reservation Summary
      const card2X = MARGIN + cardW + 15;
      doc.roundedRect(card2X, cardY, cardW, cardH, 6).fill("#F8FAFC");
      doc.roundedRect(card2X, cardY, cardW, cardH, 6).lineWidth(1).stroke("#E2E8F0");
      doc.rect(card2X, cardY, cardW, 20).fill("#F1F5F9");
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#475569")
        .text("RESERVATION SUMMARY", card2X + 10, cardY + 6);

      const trimmedTitle = mainExpTitle.length > 32 ? `${mainExpTitle.slice(0, 30)}...` : mainExpTitle;
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text(trimmedTitle, card2X + 10, cardY + 28);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text(`Location: ${destination}`, card2X + 10, cardY + 44);

      const hotelDisplay = hotelRef ? `Lodging: ${hotelName(hotelRef)}` : `Experience: Single Tour Expedition`;
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text(hotelDisplay, card2X + 10, cardY + 58);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0D9488")
        .text(`Guide: ${assignedGuide}`, card2X + 10, cardY + 72);

      // --- 4. ITEMIZED BREAKDOWN TABLE ---
      const tableY = 228;
      const thHeight = 22;

      // Table Header
      doc.roundedRect(MARGIN, tableY, CONTENT_WIDTH, thHeight, 4).fill("#0F291E");

      const colDesc = MARGIN + 10;
      const colType = MARGIN + 230;
      const colQty = MARGIN + 350;
      const colAmount = MARGIN + 420;
      const amountWidth = CONTENT_WIDTH - 430;

      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
      doc.text("ITEM & EXPERIENCE DESCRIPTION", colDesc, tableY + 7);
      doc.text("SERVICE CATEGORY", colType, tableY + 7);
      doc.text("QTY / GUESTS", colQty, tableY + 7);
      doc.text("AMOUNT (ETB)", colAmount, tableY + 7, { width: amountWidth, align: "right" });

      // Rows Data Construction
      const tableItems = [];

      // Primary Experience Row
      tableItems.push({
        title: `${mainExpTitle} - Expedition`,
        desc: "Curated guided tour route, scenic viewpoints, and heritage site permits",
        type: isPackage ? "Package Tour" : "Guided Tour",
        qty: `${travelersCount} Guest(s)`,
        amount: isPackage ? "INCLUDED" : `ETB ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });

      // Hotel stay row if applicable
      if (hotelRef) {
        tableItems.push({
          title: `${hotelName(hotelRef)} - Stay`,
          desc: "Hospitality accommodation with guest amenities and local breakfast",
          type: "Hotel Lodging",
          qty: "1 Room",
          amount: "INCLUDED",
        });
      }

      // Certified Guide & Eco Inclusion
      tableItems.push({
        title: "Certified Professional Guide & Security",
        desc: "Certified local multilingual guide, safety orientation, and reserve entry coordination",
        type: "Guide Services",
        qty: "1 Specialist",
        amount: "INCLUDED",
      });

      // Final Row: Package or Tour Total Line
      if (isPackage) {
        tableItems.push({
          title: "All-Inclusive Package Fare",
          desc: "Comprehensive bundled reservation covering lodging, guided excursions, and service taxes",
          type: "Package Fare",
          qty: "Full Itinerary",
          amount: `ETB ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        });
      }

      let currentY = tableY + thHeight + 4;
      const rowHeight = 36;

      tableItems.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(MARGIN, currentY, CONTENT_WIDTH, rowHeight).fill("#F8FAFC");
        }
        doc.rect(MARGIN, currentY + rowHeight, CONTENT_WIDTH, 1).fill("#E2E8F0");

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#0F172A")
          .text(item.title, colDesc, currentY + 6);

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor("#64748B")
          .text(item.desc, colDesc, currentY + 19, { width: 215 });

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#334155")
          .text(item.type, colType, currentY + 12);

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#334155")
          .text(item.qty, colQty, currentY + 12);

        const isPrice = item.amount.startsWith("ETB");
        doc
          .font(isPrice ? "Helvetica-Bold" : "Helvetica")
          .fontSize(isPrice ? 9.5 : 8)
          .fillColor(isPrice ? "#0F291E" : "#059669")
          .text(item.amount, colAmount, currentY + 12, { width: amountWidth, align: "right" });

        currentY += rowHeight + 2;
      });

      // --- 5. FINANCIAL TOTALS & DIGITAL PASS SECTION ---
      const totalsY = currentY + 10;
      const totalsW = 230;
      const totalsX = PAGE_WIDTH - MARGIN - totalsW;
      const totalsH = 88;

      // Totals Card (Right Side)
      doc.roundedRect(totalsX, totalsY, totalsW, totalsH, 6).fill("#F8FAFC");
      doc.roundedRect(totalsX, totalsY, totalsW, totalsH, 6).lineWidth(1).stroke("#E2E8F0");

      const padX = totalsX + 12;
      const valW = totalsW - 24;

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#64748B")
        .text("Subtotal (Excl. VAT)", padX, totalsY + 10);
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#0F172A")
        .text(`ETB ${subtotal}`, padX, totalsY + 10, { width: valW, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#64748B")
        .text("Tourism VAT (15% Inc.)", padX, totalsY + 26);
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#0F172A")
        .text(`ETB ${vatAmount}`, padX, totalsY + 26, { width: valW, align: "right" });

      doc.rect(padX, totalsY + 42, valW, 1).fill("#CBD5E1");

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0A251D")
        .text("Total Paid", padX, totalsY + 50);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#059669")
        .text(`ETB ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, padX, totalsY + 48, {
          width: valW,
          align: "right",
        });

      doc
        .font("Helvetica-Oblique")
        .fontSize(7.5)
        .fillColor("#16A34A")
        .text("✓ Payment Confirmed via Chapa / Telebirr", padX, totalsY + 69, {
          width: valW,
          align: "right",
        });

      // Digital Pass & QR Code Card (Left Side, Matching Height)
      const passW = CONTENT_WIDTH - totalsW - 15;
      const passH = totalsH;
      const passX = MARGIN;
      const passY = totalsY;

      doc.roundedRect(passX, passY, passW, passH, 6).fill("#F0FDF4");
      doc.roundedRect(passX, passY, passW, passH, 6).lineWidth(1).stroke("#86EFAC");

      if (qrBuffer) {
        doc.image(qrBuffer, passX + 8, passY + 8, { width: 72, height: 72 });
      }

      const passTextX = qrBuffer ? passX + 88 : passX + 12;
      const passTextW = qrBuffer ? passW - 96 : passW - 24;

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#065F46")
        .text("OFFICIAL DIGITAL TRAVEL PASS", passTextX, passY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0F172A")
        .text("Scan for Instant Entry", passTextX, passY + 22);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#334155")
        .text(
          "Present this QR code at trailhead checkpoints, national park gates, or hotel front-desk for expedited digital check-in.",
          passTextX,
          passY + 36,
          { width: passTextW, lineGap: 1.5 }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor("#059669")
        .text(`TOKEN: ${invoiceNumber} • CRYPTOGRAPHICALLY SECURE`, passTextX, passY + 70);

      // --- 6. TRAVELER GUIDELINES & IMPORTANT INFORMATION ---
      const guideY = totalsY + totalsH + 16;
      const guideH = 75;

      doc.roundedRect(MARGIN, guideY, CONTENT_WIDTH, guideH, 6).fill("#F8FAFC");
      doc.roundedRect(MARGIN, guideY, CONTENT_WIDTH, guideH, 6).lineWidth(1).stroke("#E2E8F0");

      doc.rect(MARGIN, guideY, CONTENT_WIDTH, 18).fill("#F1F5F9");
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#475569")
        .text("IMPORTANT TRAVELER NOTICE & EXPEDITION GUIDELINES", MARGIN + 10, guideY + 5);

      const colW = (CONTENT_WIDTH - 30) / 3;

      // Notice 1
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0F172A")
        .text("1. Check-In & Departure", MARGIN + 10, guideY + 25);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#475569")
        .text(
          "Please arrive at the tour assembly point 15 minutes before scheduled start time with this pass ready.",
          MARGIN + 10,
          guideY + 37,
          { width: colW - 10, lineGap: 1.5 }
        );

      // Notice 2
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0F172A")
        .text("2. Identity Verification", MARGIN + 10 + colW + 5, guideY + 25);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#475569")
        .text(
          "A valid government ID or passport is required for all guests to validate park conservation permits.",
          MARGIN + 10 + colW + 5,
          guideY + 37,
          { width: colW - 10, lineGap: 1.5 }
        );

      // Notice 3
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0F172A")
        .text("3. Recommended Gear", MARGIN + 10 + (colW + 5) * 2, guideY + 25);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#475569")
        .text(
          "Sturdy trekking shoes, rain gear, sun protection, and personal hydration flasks are strongly advised.",
          MARGIN + 10 + (colW + 5) * 2,
          guideY + 37,
          { width: colW - 10, lineGap: 1.5 }
        );

      // --- 7. LUXURY CORPORATE FOOTER ---
      const footerY = 745;
      doc.rect(MARGIN, footerY, CONTENT_WIDTH, 1).fill("#E2E8F0");

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0A251D")
        .text("Kambata Travel Services Ltd.", MARGIN, footerY + 10);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#64748B")
        .text(
          "Headquarters: Durame, Kambata Zone  •  Hawassa Branch  •  Addis Ababa Liaison Office",
          MARGIN,
          footerY + 22
        );

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#94A3B8")
        .text(
          "Official electronic tax receipt & confirmed travel pass. Generated automatically by Kambata Travel Platform.",
          MARGIN,
          footerY + 34
        );

      const contactW = 190;
      const contactX = PAGE_WIDTH - MARGIN - contactW;
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#0A251D")
        .text("24/7 Traveler Assistance:", contactX, footerY + 10, { width: contactW, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#059669")
        .text("support@kambata.travel  •  +251 91 100 0000", contactX, footerY + 22, {
          width: contactW,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#64748B")
        .text("www.kambata.travel", contactX, footerY + 34, { width: contactW, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePdf };
