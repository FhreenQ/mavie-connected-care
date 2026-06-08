const express = require("express");
const router = express.Router();

const {
  checkPair,
  checkList,
} = require("../controllers/drugInteractionController");

router.post("/check-pair", checkPair);
router.post("/check-list", checkList);

module.exports = router;