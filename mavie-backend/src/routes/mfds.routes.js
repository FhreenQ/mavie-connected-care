const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  searchDrugProducts,
  getDrugProductDetail,
  getDrugMainIngredientDetail,
  confirmDetectedDrug,
} = require("../services/mfdsDrug.service");

const router = express.Router();

// Search official Korean medicine products from MFDS.
router.get("/drugs/search", authMiddleware, async (req, res) => {
  try {
    const {
      itemName,
      itemSeq,
      entpName,
      mainItemIngr,
      pageNo = 1,
      numOfRows = 10,
    } = req.query;

    if (!itemName && !itemSeq && !entpName && !mainItemIngr) {
      return res.status(400).json({
        message:
          "At least one search parameter is required: itemName, itemSeq, entpName, or mainItemIngr",
      });
    }

    const result = await searchDrugProducts({
      itemName,
      itemSeq,
      entpName,
      mainItemIngr,
      pageNo,
      numOfRows,
    });

    res.json({
      message: "MFDS drug products retrieved successfully",
      ...result,
    });
  } catch (error) {
    handleMfdsError(res, error, "MFDS drug product search failed");
  }
});

// Get official Korean medicine product detail by MFDS item sequence.
router.get("/drugs/:itemSeq", authMiddleware, async (req, res) => {
  try {
    const result = await getDrugProductDetail({
      itemSeq: req.params.itemSeq,
    });

    if (!result.items.length) {
      return res.status(404).json({
        message: "MFDS drug product not found",
      });
    }

    res.json({
      message: "MFDS drug product detail retrieved successfully",
      product: result.items[0],
      mfds: {
        pageNo: result.pageNo,
        numOfRows: result.numOfRows,
        totalCount: result.totalCount,
      },
    });
  } catch (error) {
    handleMfdsError(res, error, "MFDS drug product detail lookup failed");
  }
});

// Get official main ingredient detail rows for a product.
router.get("/drugs/:itemSeq/ingredients", authMiddleware, async (req, res) => {
  try {
    const result = await getDrugMainIngredientDetail({
      itemSeq: req.params.itemSeq,
      pageNo: req.query.pageNo || 1,
      numOfRows: req.query.numOfRows || 50,
    });

    res.json({
      message: "MFDS main ingredient details retrieved successfully",
      ...result,
    });
  } catch (error) {
    handleMfdsError(res, error, "MFDS main ingredient detail lookup failed");
  }
});

// Confirm OpenAI-detected Korean label text against official MFDS product data.
router.post("/drugs/confirm", authMiddleware, async (req, res) => {
  try {
    const {
      visibleProductName,
      strength,
      visibleIngredient,
      rawVisibleText,
      itemSeq,
    } = req.body;

    if (!visibleProductName && !visibleIngredient && !rawVisibleText && !itemSeq) {
      return res.status(400).json({
        message:
          "visibleProductName, visibleIngredient, rawVisibleText, or itemSeq is required",
      });
    }

    const confirmation = await confirmDetectedDrug({
      visibleProductName,
      strength,
      visibleIngredient,
      rawVisibleText,
      itemSeq,
    });

    res.json({
      message: "MFDS medicine confirmation completed",
      safetyDisclaimer:
        "MFDS lookup confirms official product information only. The user must still confirm before saving or changing medication.",
      ...confirmation,
    });
  } catch (error) {
    handleMfdsError(res, error, "MFDS medicine confirmation failed");
  }
});

function handleMfdsError(res, error, message) {
  console.error(message, error);

  res.status(error.statusCode || 500).json({
    message,
    error: error.message,
    mfdsHeader: error.mfdsHeader,
  });
}

module.exports = router;
