// server/routers/marketingRouter.js
const express = require("express");
const router = express.Router();
const marketingService = require("../services/marketingService.js");

// 거래처 등록
router.post("/marketing/insertacc", async (req, res) => {
  const { body } = req;
  try {
    const result = await marketingService.addAccount(body);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ error: e });
  }
});

// 태완 - 입고
router.get("/inboundList", async (req, res) => {
  let list = await marketingService.inboundList();
  res.send(list);
});

router.post("/inboundInsert", async (req, res) => {
  try {
    const data = req.body;
    let result = await marketingService.inboundInsert(data);
    res.json(result);
  } catch (e) {
    console.log(e);
  }
});

router.post("/inboundSearch", async (req, res) => {
  const data = req.body;
  try {
    let list = await marketingService.inboundSearch(data);
    res.send(list);
  } catch (e) {
    console.log(e);
  }
});

// 주문서 거래처/제품 조회모달
router.get("/reqCusModal", async (req, res) => {
  let list = await marketingService.reqCusModal();
  res.send(list);
});
router.get("/reqPrdModal", async (req, res) => {
  let list = await marketingService.reqPrdModal();
  res.send(list);
});

/* 주문서 등록 (헤더) — 새 REQ_ID 반환 */
router.post("/reqInsert", async (req, res) => {
  try {
    const data = req.body;
    const result = await marketingService.reqInsert(data);
    res.json(result); // { success:true, reqId:'REQ-xxx' }
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

/* 주문서 등록 (상세) — 헤더에서 받은 reqId로 저장 */
router.post("/reqDetailInsert", async (req, res) => {
  try {
    const data = req.body; // { reqId, rows:[{REQ_QTY, PRD_CODE}, ...] }
    const result = await marketingService.reqDetailInsert(data);
    res.json(result);
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

/* 주문서 조회 */
router.get("/reqSelect", async (req, res) => {
  let list = await marketingService.reqSelect();
  res.send(list);
});

// 주문서 상태 변경 (예: 대기→진행중/완료/취소)
router.put("/reqStatus", async (req, res) => {
  try {
    const result = await marketingService.updateReqStatus(req.body || {});
    res.json(result);
  } catch (e) {
    console.log(e);
    res.json({ ok: false });
  }
});

// LOT/창고/출하
router.get("/lotSelect", async (req, res) => {
  let list = await marketingService.lotSelect();
  res.send(list);
});
router.get("/wrNameSelect", async (req, res) => {
  let list = await marketingService.wrNameSelect();
  res.send(list);
});
router.get("/shipSelect", async (req, res) => {
  let list = await marketingService.shipSelect();
  res.send(list);
});

module.exports = router;

// 거래처 조회
router.get("/marketing/getacclist", async (req, res) => {
  try {
    const result = await marketingService.getAccountList();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.send({ error: error });
  }
});

// 거래처 삭제
router.post('/deleteacc/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log("📌 요청 ids:", ids);

    const result = await mariadb.query('deleteAccount', ids);
    console.log("📌 삭제 실행 결과:", result);

    res.json({ ok: true });
  } catch (e) {
    console.error("❌ 삭제 에러:", e);
    res.status(500).json({ ok: false, msg: e.message });  // 클라이언트에도 원인 전달
  }
});



// 출하지시서등록 - 주문서모달
router.get("/shipModalSelect", async (req, res) => {
  let list = await marketingService.shipModalSelect();
  res.send(list);
});

//출하지시서 - 입고 모달
router.post("/shipPrdSelect", async (req, res) => {
  try {
    const data = req.body;
    let result = await marketingService.shipPrdSelect(data);
    res.json(result);
  } catch (e) {
    console.log(e);
  }
});

// 출하 지시 등록 버튼
router.post("/shipInsert", async (req, res) => {
  try {
    const data = req.body;
    let result = await marketingService.shipInsert(data);
    res.json(result);
  } catch (e) {
    console.log(e);
  }
});
module.exports = router;
