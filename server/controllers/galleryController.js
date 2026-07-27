const Destination = require("../models/Destination");
const Tour = require("../models/Tour");
const logger = require("../utils/logger");

// @desc    Get all gallery assets aggregated from destinations and tours
// @route   GET /api/gallery
// @access  Public
// @desc    Get all gallery assets aggregated from destinations and tours
// @route   GET /api/gallery
// @access  Public
const getGalleryAssets = async (req, res, next) => {
  try {
    const { category } = req.query;

    const STATIC_ASSETS = [
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776367900/photo_2026-04-16_22-30-38_p79tks.jpg",
        title: "The Masala Keepers",
        subtitle: "A Tradition of Woven Elegance",
        description: "Kambata women in traditional dress displaying the finely woven Masala containers, a symbol of communal heritage and craftsmanship.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776368170/imagekambata_etmd6j.png",
        title: "The Goje Greeting",
        subtitle: "Warmth at the Ancestral Home",
        description: "Young women in vibrant traditional attire gathered in front of a Goje—the iconic thatched house that forms the heart of Kambata community life.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg",
        title: "Fields of Tradition",
        subtitle: "Harvest Days in the Highlands",
        description: "Kambata women traversing the lush highlands with Masala baskets, showcasing the interplay between traditional labor and ancestral architecture.",
        category: "Landscapes",
        link: "/tours"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600765/2479dbfe-52dc-4cd5-aa49-c06eef7ad8c4_tpm9vx.jpg",
        title: "Market Smiles",
        subtitle: "The Vibrancy of Local Exchange",
        description: "A candid moment reflecting the warmth of Kambata hospitality, set against a backdrop of circular woven cultural artifacts.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601178/9e8c8cd8-6b95-42eb-8eae-0cef98f6693b_txs84b.jpg",
        title: "Lakeside Elegance",
        subtitle: "Serenity at the Water's Edge",
        description: "The diverse fashion of Kambata youth displayed by the serene lakesides, blending ancestral patterns with modern grace.",
        category: "Landscapes",
        link: "/tours"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601567/image_2026-04-19_10-18-47_2_hpy1pd.png",
        title: "Highland Bloom",
        subtitle: "A Childhood in the Green Heart",
        description: "A portrait of youth and nature, featuring traditional cowrie shell headbands and a bouquet of indigenous highland wildflowers.",
        category: "Landscapes",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601487/image_2026-04-19_10-15-04_jofbvm.png",
        title: "The Pulse of Kambata",
        subtitle: "Guardians of the Sacred Drum",
        description: "A grand display of Kambata heritage, featuring traditional warriors with shields and the rhythmic heartbeat of the communal drum.",
        category: "Festivals",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601621/image_2026-04-19_10-21-38_2_e1rrax.png",
        title: "Shores of Heritage",
        subtitle: "Gathering Highland Botanicals",
        description: "Traditional gathering of local herbs and botanicals by the lakeside, showcasing the deep ecological knowledge of the Kambata people.",
        category: "Landscapes",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601634/image_2026-04-19_10-22-41_prdudr.png",
        title: "The Weaver's Pride",
        subtitle: "Modernity Meets Ancient Threads",
        description: "Hand-woven Kambata fabrics stylized into modern attire, bridging the gap between ancestral craft and contemporary fashion.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png",
        title: "Artisan's Marketplace",
        subtitle: "Curating the Colors of Kambata",
        description: "The vibrant marketplace where conical Masala baskets display the intricate geometry and artistry of highland weaving.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601670/image_2026-04-19_10-26-24_2_lxnsx2.png",
        title: "Sacred Savory",
        subtitle: "Artistry in Morning Grains",
        description: " roasted traditional grains presented in an artistic horn-shaped bowl, highlighting the ceremonial beauty of Kambata cuisine.",
        category: "Culinary",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601664/image_2026-04-19_10-25-38_2_i0p90y.png",
        title: "Market Presence",
        subtitle: "A Welcome as Warm as the Sun",
        description: "Local artisans and traders sharing the joyful spirit of the community amidst their woven creations.",
        category: "Culture",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601683/image_2026-04-19_10-28-44_vp0bnu.png",
        title: "Highland Hospitality",
        subtitle: "The Ritual of the Sacred Bean",
        description: "Coffee ceremony with a view—the aromatic ritual of Kambata coffee served against a breathtaking panoramic mountain landscape.",
        category: "Culinary",
        link: "/heritage"
      },
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601705/image_2026-04-19_10-34-31_zgxc8i.png",
        title: "Youthful Discovery",
        subtitle: "Exploring the Slopes of Our Heritage",
        description: "The next generation of explorers embracing the highlands, captured in a moment of communal adventure on the green slopes.",
        category: "Landscapes",
        link: "/tours"
      }
    ];

    // 1. Fetch Destinations
    const destinations = await Destination.find({ isPublished: true });
    
    // 2. Fetch Tours
    const tours = await Tour.find({ isPublished: true }).populate("destination");

    let assets = [...STATIC_ASSETS];

    // Process Destinations
    destinations.forEach(dest => {
      const destImages = [...(dest.images || []), ...(dest.gallery || [])];
      destImages.forEach(img => {
        let assetCategory = "Landscapes";
        if (dest.category?.includes("culture") || dest.category?.includes("religious") || dest.category?.includes("historical")) {
          assetCategory = "Culture";
        }

        if (!assets.find(a => a.url === img)) {
          assets.push({
            url: img,
            title: dest.name.en,
            subtitle: dest.location?.woreda || "Kambata Zone",
            description: dest.description.en,
            category: assetCategory,
            link: `/explore/${dest._id}`
          });
        }
      });
    });

    // Process Tours
    tours.forEach(tour => {
      const tourImages = [...(tour.images || []), ...(tour.gallery || [])];
      tourImages.forEach(img => {
        let assetCategory = "Landscapes";
        if (tour.category?.toLowerCase() === "culture" || tour.category?.toLowerCase() === "heritage") {
          assetCategory = "Culture";
        }
        
        // Specific culinary tagging logic (if title mentions food)
        if (tour.title.en.toLowerCase().includes("food") || tour.title.en.toLowerCase().includes("atakan")) {
          assetCategory = "Culinary";
        }

        if (!assets.find(a => a.url === img)) {
          assets.push({
            url: img,
            title: tour.title.en,
            subtitle: tour.destination?.name?.en || "Curated Expedition",
            description: tour.description.en,
            category: assetCategory,
            link: `/tours`
          });
        }
      });
    });

    // Filter by category if requested
    if (category && category !== "All") {
      assets = assets.filter(a => a.category === category);
    }

    // Deduplicate and Shuffle
    const uniqueAssets = Array.from(new Set(assets.map(a => a.url)))
      .map(url => assets.find(a => a.url === url));

    res.json({
      success: true,
      data: uniqueAssets.sort(() => Math.random() - 0.5)
    });
  } catch (error) {
    logger.error(`Error fetching gallery: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getGalleryAssets
};

