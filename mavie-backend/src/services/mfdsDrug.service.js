const http = require("http");
const https = require("https");

const DEFAULT_BASE_URL =
  "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07";
const DEFAULT_TIMEOUT_MS = 10000;

const OPERATIONS = {
  productList: "getDrugPrdtPrmsnInq07",
  productDetail: "getDrugPrdtPrmsnDtlInq06",
  mainIngredientDetail: "getDrugPrdtMcpnDtlInq07",
};

async function searchDrugProducts({
  itemName,
  itemSeq,
  entpName,
  mainItemIngr,
  pageNo = 1,
  numOfRows = 10,
} = {}) {
  const data = await callMfdsApi(OPERATIONS.productList, {
    item_name: itemName,
    item_seq: itemSeq,
    entp_name: entpName,
    main_item_ingr: mainItemIngr,
    pageNo,
    numOfRows,
  });

  return normalizeMfdsResponse(data, normalizeDrugProduct);
}

async function getDrugProductDetail({
  itemSeq,
  itemName,
  mainItemIngr,
} = {}) {
  const data = await callMfdsApi(OPERATIONS.productDetail, {
    item_seq: itemSeq,
    item_name: itemName,
    main_item_ingr: mainItemIngr,
    pageNo: 1,
    numOfRows: 10,
  });

  return normalizeMfdsResponse(data, normalizeDrugProduct);
}

async function getDrugMainIngredientDetail({
  itemSeq,
  itemName,
  pageNo = 1,
  numOfRows = 50,
} = {}) {
  const data = await callMfdsApi(OPERATIONS.mainIngredientDetail, {
    item_seq: itemSeq,
    item_name: itemName,
    pageNo,
    numOfRows,
  });

  return normalizeMfdsResponse(data, normalizeMainIngredient);
}

async function confirmDetectedDrug({
  visibleProductName,
  strength,
  visibleIngredient,
  rawVisibleText,
  itemSeq,
} = {}) {
  if (itemSeq) {
    const detailResult = await getDrugProductDetail({ itemSeq });
    const detail = detailResult.items[0] || null;

    return {
      matchSource: detail ? "MFDS_ITEM_SEQ" : "NO_MATCH",
      confidence: detail ? 1 : 0,
      bestMatch: detail,
      candidates: detail ? [detail] : [],
      mfds: detailResult,
    };
  }

  const searchTerm = firstNonEmpty(
    visibleProductName,
    extractLikelyProductName(rawVisibleText),
    visibleIngredient
  );

  if (!searchTerm) {
    return {
      matchSource: "MANUAL_REQUIRED",
      confidence: 0,
      bestMatch: null,
      candidates: [],
      mfds: null,
      warnings: [
        "No product name or ingredient was detected. Please confirm the text manually before MFDS lookup.",
      ],
    };
  }

  let mfdsResult = await searchDrugProducts({
    itemName: searchTerm,
    pageNo: 1,
    numOfRows: 10,
  });

  if (!mfdsResult.items.length && visibleIngredient) {
    mfdsResult = await searchDrugProducts({
      mainItemIngr: visibleIngredient,
      pageNo: 1,
      numOfRows: 10,
    });
  }

  const ranked = rankMfdsCandidates(mfdsResult.items, {
    visibleProductName: searchTerm,
    strength,
    visibleIngredient,
    rawVisibleText,
  });
  const bestMatch = ranked[0] || null;

  return {
    matchSource: bestMatch ? "MFDS_SEARCH" : "NO_MATCH",
    confidence: bestMatch?.matchConfidence || 0,
    bestMatch,
    candidates: ranked,
    mfds: {
      pageNo: mfdsResult.pageNo,
      numOfRows: mfdsResult.numOfRows,
      totalCount: mfdsResult.totalCount,
    },
    warnings: buildConfirmationWarnings(bestMatch),
  };
}

async function callMfdsApi(operation, params = {}) {
  const serviceKey =
    process.env.MFDS_SERVICE_KEY || process.env.MFDS_DRUG_API_KEY;

  if (!serviceKey) {
    const error = new Error(
      "MFDS service key is not configured. Set MFDS_SERVICE_KEY in .env."
    );
    error.statusCode = 500;
    throw error;
  }

  const baseUrl = process.env.MFDS_DRUG_API_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${operation}`);

  appendQueryParam(url, "serviceKey", serviceKey);
  appendQueryParam(url, "type", "json");

  for (const [key, value] of Object.entries(params)) {
    appendQueryParam(url, key, value);
  }

  const payload = await requestJson(url);
  const response = payload.response || payload;
  const header = response.header || {};
  const resultCode = String(header.resultCode || header.RESULT_CODE || "");

  if (resultCode && !["00", "0"].includes(resultCode)) {
    const error = new Error(
      header.resultMsg ||
        header.RESULT_MSG ||
        "MFDS API returned an error response."
    );
    error.statusCode = 502;
    error.mfdsHeader = header;
    throw error;
  }

  return response;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "http:" ? http : https;
    const timeoutMs = Number(process.env.MFDS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(
            `MFDS API request failed with status ${response.statusCode}`
          );
          error.statusCode = 502;
          return reject(error);
        }

        try {
          resolve(JSON.parse(body));
        } catch (parseError) {
          parseError.statusCode = 502;
          parseError.message = `MFDS API returned non-JSON data: ${parseError.message}`;
          reject(parseError);
        }
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error("MFDS API request timed out."));
    });

    request.on("error", (error) => {
      error.statusCode = 502;
      reject(error);
    });
  });
}

function normalizeMfdsResponse(response, normalizeItem) {
  const body = response.body || {};
  const rawItems = normalizeItems(body.items || body.item);

  return {
    pageNo: Number(body.pageNo || 1),
    numOfRows: Number(body.numOfRows || rawItems.length),
    totalCount: Number(body.totalCount || rawItems.length),
    items: rawItems.map(normalizeItem),
  };
}

function normalizeItems(items) {
  if (!items) {
    return [];
  }

  if (Array.isArray(items)) {
    return items;
  }

  if (Array.isArray(items.item)) {
    return items.item;
  }

  if (items.item) {
    return [items.item];
  }

  return [items];
}

function normalizeDrugProduct(item) {
  const itemName = cleanString(item.ITEM_NAME || item.item_name);
  const rawMainIngredientText = firstNonEmpty(
    item.MAIN_ITEM_INGR,
    item.main_item_ingr,
    extractIngredientsFromItemName(itemName)
  );
  const activeIngredientDetails = parseIngredientList(rawMainIngredientText);
  const inactiveIngredientDetails = parseIngredientList(
    item.INGR_NAME || item.ingr_name
  );
  const materialDetails = parseMaterialDetails(
    item.MATERIAL_NAME || item.material_name
  );

  return {
    itemSeq: cleanString(item.ITEM_SEQ || item.item_seq),
    itemName,
    itemNameEn: cleanString(item.ITEM_ENG_NAME || item.item_eng_name),
    entpName: cleanString(item.ENTP_NAME || item.entp_name),
    entpNameEn: cleanString(item.ENTP_ENG_NAME || item.entp_eng_name),
    itemPermitDate: formatMfdsDate(
      item.ITEM_PERMIT_DATE || item.item_permit_date
    ),
    etcOtcCode: cleanString(item.ETC_OTC_CODE || item.etc_otc_code),
    className: cleanString(item.CLASS_NAME || item.class_name),
    chart: cleanString(item.CHART || item.chart),
    barCodes: splitDelimitedText(item.BAR_CODE || item.bar_code),
    materialName: cleanString(item.MATERIAL_NAME || item.material_name),
    materialDetails,
    mainItemIngrRaw: cleanString(rawMainIngredientText),
    activeIngredients: activeIngredientDetails.map(
      (ingredient) => ingredient.name
    ),
    activeIngredientDetails,
    activeIngredientCodes: activeIngredientDetails
      .map((ingredient) => ingredient.code)
      .filter(Boolean),
    inactiveIngredientDetails,
    mainIngredientEn: cleanString(item.MAIN_INGR_ENG || item.main_ingr_eng),
    atcCode: cleanString(item.ATC_CODE || item.atc_code),
    storageMethod: cleanString(item.STORAGE_METHOD || item.storage_method),
    validTerm: cleanString(item.VALID_TERM || item.valid_term),
    packUnits: splitDelimitedText(item.PACK_UNIT || item.pack_unit),
    documentUrls: {
      efficacy: cleanString(item.EE_DOC_ID || item.ee_doc_id),
      dosage: cleanString(item.UD_DOC_ID || item.ud_doc_id),
      precautions: cleanString(item.NB_DOC_ID || item.nb_doc_id),
      insert: cleanString(item.INSERT_FILE || item.insert_file),
    },
    status: cleanString(item.CANCEL_NAME || item.cancel_name),
    rareDrugYn: cleanString(item.RARE_DRUG_YN || item.rare_drug_yn),
  };
}

function normalizeMainIngredient(item) {
  const ingredient = parseIngredientToken(
    item.MAIN_ITEM_INGR || item.main_item_ingr || item.INGR_NAME
  );

  return {
    itemSeq: cleanString(item.ITEM_SEQ || item.item_seq),
    itemName: cleanString(item.ITEM_NAME || item.item_name),
    entpName: cleanString(item.ENTP_NAME || item.entp_name),
    ingredientCode: ingredient.code,
    ingredientName: ingredient.name,
    ingredientRaw: ingredient.raw,
    amount: cleanString(item.AMOUNT || item.amount),
    unit: cleanString(item.UNIT || item.unit),
    totalAmountSequence: cleanString(item.TAMT_SEQ || item.tamt_seq),
  };
}

function rankMfdsCandidates(candidates, detected) {
  return candidates
    .map((candidate) => {
      const score = scoreCandidate(candidate, detected);

      return {
        ...candidate,
        matchConfidence: score,
      };
    })
    .sort((a, b) => b.matchConfidence - a.matchConfidence);
}

function scoreCandidate(candidate, detected) {
  const candidateName = normalizeForMatch(candidate.itemName);
  const candidateIngredients = normalizeForMatch(
    `${candidate.mainItemIngrRaw} ${candidate.activeIngredients?.join(" ")} ${
      candidate.materialName
    }`
  );
  const visibleName = normalizeForMatch(detected.visibleProductName);
  const visibleIngredient = normalizeForMatch(detected.visibleIngredient);
  const rawVisibleText = normalizeForMatch(detected.rawVisibleText);
  const strength = normalizeForMatch(detected.strength);

  let score = 0.25;

  if (visibleName && candidateName === visibleName) {
    score += 0.45;
  } else if (visibleName && candidateName.includes(visibleName)) {
    score += 0.35;
  } else if (visibleName && visibleName.includes(candidateName)) {
    score += 0.25;
  }

  if (visibleIngredient && candidateIngredients.includes(visibleIngredient)) {
    score += 0.2;
  }

  if (strength && candidateName.includes(strength)) {
    score += 0.1;
  } else if (strength && candidateIngredients.includes(strength)) {
    score += 0.1;
  }

  if (rawVisibleText && candidateName && rawVisibleText.includes(candidateName)) {
    score += 0.1;
  }

  return Number(Math.min(score, 1).toFixed(2));
}

function parseIngredientList(value) {
  const text = cleanString(value);

  if (!text) {
    return [];
  }

  const parsed = text
    .split(/\||[,;]|(?:\s\/\s)|(?:\s\+\s)|(?:\s및\s)/)
    .map(parseIngredientToken)
    .filter((ingredient) => ingredient.name);

  return dedupeIngredients(parsed);
}

function parseIngredientToken(value) {
  const raw = cleanString(value);

  if (!raw) {
    return {
      code: "",
      name: "",
      raw: "",
    };
  }

  const codeMatch = raw.match(/^\[([^\]]+)\]\s*(.+)$/);

  if (codeMatch) {
    return {
      code: cleanString(codeMatch[1]),
      name: cleanIngredientName(codeMatch[2]),
      raw,
    };
  }

  return {
    code: "",
    name: cleanIngredientName(raw),
    raw,
  };
}

function cleanIngredientName(value) {
  return cleanString(value)
    .replace(/\[[^\]]+\]/g, "")
    .replace(/^성분명\s*:\s*/i, "")
    .trim();
}

function dedupeIngredients(ingredients) {
  const seen = new Set();

  return ingredients.filter((ingredient) => {
    const key = normalizeForMatch(`${ingredient.code}-${ingredient.name}`);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function extractIngredientsFromItemName(itemName) {
  const text = cleanString(itemName);
  const matches = [...text.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);

  return matches.join(",");
}

function parseMaterialDetails(value) {
  const text = cleanString(value);

  if (!text) {
    return [];
  }

  const fields = {};

  text.split("|").forEach((part) => {
    const [rawKey, ...rawValueParts] = part.split(":");
    const key = cleanString(rawKey);
    const fieldValue = cleanString(rawValueParts.join(":"));

    if (!key) {
      return;
    }

    fields[key] = fieldValue;
  });

  if (!Object.keys(fields).length) {
    return [];
  }

  return [
    {
      totalAmount: fields["총량"] || "",
      ingredientName: fields["성분명"] || "",
      amount: fields["분량"] || "",
      unit: fields["단위"] || "",
      standard: fields["규격"] || "",
      ingredientInfo: fields["성분정보"] || "",
      note: fields["비고"] || "",
    },
  ];
}

function splitDelimitedText(value) {
  const text = cleanString(value);

  if (!text) {
    return [];
  }

  return text
    .split(",")
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function formatMfdsDate(value) {
  const text = cleanString(value);

  if (!/^\d{8}$/.test(text)) {
    return text;
  }

  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function extractLikelyProductName(rawText) {
  const text = cleanString(rawText);

  if (!text) {
    return "";
  }

  return text
    .split(/\r?\n|[.。]/)
    .map((line) => cleanString(line))
    .find((line) => line.length >= 2 && line.length <= 80);
}

function buildConfirmationWarnings(bestMatch) {
  if (!bestMatch) {
    return [
      "No official MFDS product match was found. Ask the user to confirm the Korean product name manually.",
    ];
  }

  if (bestMatch.matchConfidence < 0.7) {
    return [
      "MFDS returned possible candidates, but the match confidence is moderate. Ask the user to confirm before saving.",
    ];
  }

  return [
    "MFDS match is a product-information lookup only. The user must still confirm before saving medication details.",
  ];
}

function appendQueryParam(url, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  url.searchParams.set(key, String(value));
}

function firstNonEmpty(...values) {
  return values.map(cleanString).find(Boolean) || "";
}

function cleanString(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

module.exports = {
  searchDrugProducts,
  getDrugProductDetail,
  getDrugMainIngredientDetail,
  confirmDetectedDrug,
};
