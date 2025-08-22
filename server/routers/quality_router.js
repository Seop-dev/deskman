const express = require("express");
const router = express.Router();
const qualityService = require("../services/quality_service");

// 합격불합격 원자재 조회
router.get("/mathisall", async (req, res) => {
  let list = await qualityService.matHisAll();
  res.send(list);
});

// 원자재검수관리 조회
router.get("/matmng", async (req, res) => {
  let list = await qualityService.matMng();
  res.send(list);
});

// 완반제품 성적서 조회
router.get("/prdcertlist", async (req, res) => {
  let list = await qualityService.selectPrdCert();
  res.send(list);
});

// 합격원자재 등록
router.post("/passmat", async (req, res) => {
  try {
    const body = req.body || {};
    console.log("passmat body:", body);

    const result = await qualityService.addPassMat(body);

    res.json({
      ok: true,
      affected: result.affectedRows ?? result.affected_rows ?? 0,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "저장 실패", error: String(err) });
  }
});

// 불합격원자재 등록

// 불합격제품 등록 (수정된 버전)
router.post("/rejectprd", async (req, res) => {
  try {
    const b = req.body || {};
    console.log("불합격제품 등록 요청 데이터:", JSON.stringify(b, null, 2));

    // 필수 필드 검증
    // if (!b.TP_ID || !b.PRD_CODE || !b.RJT_REASON) {
    //   return res.status(400).json({
    //     ok: false,
    //     message: "필수 필드가 누락되었습니다. (TP_ID, PRD_CODE, RJT_REASON)",
    //   });
    // }

    const result = await qualityService.addRejectPrd({
      TP_ID: Number(b.TP_ID) || 0,
      PRD_CODE: String(b.PRD_CODE || ""),
      PRD_NAME: String(b.PRD_NAME || ""),
      PRD_TYPE: String(b.PRD_TYPE || ""),
      TOTAL_QTY: Number(b.TOTAL_QTY) || 0,
      Q_CHECKED_DATE: String(b.Q_CHECKED_DATE || ""),
      CREATED_BY: String(b.CREATED_BY || ""),
      RJT_REASON: String(b.RJT_REASON || ""),
    });

    console.log("불합격제품 등록 결과:", result);
    return res.status(201).json({
      ok: true,
      prdCertId: result.PRD_CERT_ID,
      message: "불합격 제품이 성공적으로 등록되었습니다.",
    });
  } catch (e) {
    console.error("[POST /rejectprd] error:", e);
    return res.status(500).json({
      ok: false,
      message: "불합격 제품 등록 중 오류가 발생했습니다.",
      error: String(e?.message || e),
    });
  }
});

// 제품공정조회
router.get("/taskprd", async (req, res) => {
  let list = await qualityService.selectTaskPrd();
  res.send(list);
});

// 합격제품등록
router.post("/passprd", async (req, res) => {
  try {
    const b = req.body || {};
    const result = await qualityService.addPassPrd({
      TP_ID: String(b.TP_ID),
      PRD_NAME: String(b.PRD_NAME),
      PRD_CODE: String(b.PRD_CODE),
      TOTAL_QTY: Number(b.TOTAL_QTY) || 0,
      PRD_TYPE: String(b.PRD_TYPE),
      Q_CHECKED_DATE: String(b.Q_CHECKED_DATE),
      CREATED_BY: b.CREATED_BY || null,
    });

    res.json({ ok: true, affected: result.affectedRows || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err.sqlMessage || err.message,
      code: err.code,
    });
  }
});

// 불합격제품 등록
router.post("/rejectprd", async (req, res) => {
  try {
    const b = req.body || {};
    console.log("불합격제품 등록 시도 =>" + b);
    const r = await qualityService.addRejectPrd(b); // { ok:true, PRD_CERT_ID: '...' }
    return res.status(201).json({ ok: true, prdCertId: r.PRD_CERT_ID });
  } catch (e) {
    console.error("[POST /rejectprd] error:", e);
    return res.status(500).json({
      ok: false,
      message: "불합격 저장 실패",
      error: String(e?.message || e),
    });
  }
});

// 품질기준 조회
router.get("/qstdlist", async (req, res) => {
  const list = await qualityService.selectQstd();
  res.send(list);
});

// 품질기준 변경 (POST)
router.post("/qstdupdate", async (req, res) => {
  try {
    const result = await qualityService.updateQstd(req.body);

    if (!result || (result.affectedRows ?? 0) === 0) {
      return res.status(404).json({ ok: false, message: "대상 없음" });
    }
    res.json({ ok: true, affected: result.affectedRows });
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err.sqlMessage || err.message,
      code: err.code,
    });
  }
});

// 품질공통코드
router.get("/qccommon", async (req, res) => {
  let list = await qualityService.qcCommonCode();
  res.send(list);
});

// 원자재 입고공통코드
router.get("/matcommon", async (req, res) => {
  let list = await qualityService.matCommonCode();
  res.send(list);
});

module.exports = router;
