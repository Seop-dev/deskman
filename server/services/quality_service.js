const mariadb = require("../database/mapper.js");

// 합/불 원자재 조회
const matHisAll = async () => {
  let list = await mariadb.query("materialSelect");
  return list;
};

// 원자재검수관리 조회
const matMng = async () => {
  let list = await mariadb.query("matManagement");
  return list;
};

// 합격원자재 등록
const addPassMat = async (data) => {
  const params = [
    data.RECEIPT_NO,
    data.MAT_CODE,
    data.TOTAL_QTY,
    data.Q_CHECKED_DATE,
    data.CREATED_BY,
  ];
  return mariadb.query("passMat", params);
};

// 불합격원자재 등록
const addRejectMat = async (data) => {
  const params = [
    data.RECEIPT_NO,
    data.MAT_CODE,
    data.RJT_REASON,
    data.Q_CHECKED_DATE,
    data.TOTAL_QTY,
    data.CREATED_BY,
  ];
  return mariadb.query("rejectMat", params);
};

// 제품공정조회
const selectTaskPrd = async () => {
  let list = await mariadb.query("taskPrd");
  return list;
};

// 제품성적서조회
const selectPrdCert = async () => {
  let list = await mariadb.query("selectProductCertificate");
  return list;
};

// 합격제품등록
const addPassPrd = async (b) => {
  const params = [
    Number(b.TP_ID) || 0, // INT
    String(b.PRD_CODE || ""),
    b.PRD_NAME || null,
    Number(b.TOTAL_QTY) || 0, // INT
    b.PRD_TYPE || null,
    String(b.Q_CHECKED_DATE || ""), // 'YYYY-MM-DD'
    b.CREATED_BY || null,
  ];
  return await mariadb.query("passPrd", params);
};

// 불합격제품등록
const addRejectPrd = async (b) => {
  const conn = await mariadb.getConnection();
  try {
    await conn.beginTransaction();

    // 🔐 PRD_CERT_ID를 딱 1번만 뽑아서 두 테이블에 동일하게 사용
    const [{ NEXT_ID }] = await conn.query(
      `SELECT GetNextPRD_CERT_ID() AS NEXT_ID`
    );
    if (!NEXT_ID) throw new Error("GetNextPRD_CERT_ID() failed");

    // 1) PRODUCT_CERTIFICATE (불합격 헤더)
    await conn.query(
      `
      INSERT INTO PRODUCT_CERTIFICATE
        (PRD_CERT_ID, TP_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE, PRD_STATUS, CREATED_BY)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, '불합격', ?)
      `,
      [
        NEXT_ID,
        Number(b.TP_ID) || 0,
        String(b.PRD_CODE || ""),
        b.PRD_NAME || null,
        Number(b.TOTAL_QTY) || 0,
        b.PRD_TYPE || null,
        String(b.Q_CHECKED_DATE || ""), // 'YYYY-MM-DD'
        b.CREATED_BY || null,
      ]
    );

    // 2) REJECTED_PRODUCT (상세)
    await conn.query(
      `
      INSERT INTO REJECTED_PRODUCT
        (RJT_PRD_ID, PRD_CERT_ID, PRD_CODE, RJT_CODE, RJT_REASON)
      VALUES
        (GetNextRJT_PRD_ID(), ?, ?, ?, ?)
      `,
      [
        NEXT_ID, // 동일한 PRD_CERT_ID 사용
        String(b.PRD_CODE || ""),
        b.RJT_CODE || null,
        String(b.RJT_REASON || "").slice(0, 100),
      ]
    );

    await conn.commit();
    return { ok: true, PRD_CERT_ID: NEXT_ID };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// 품질기준조회
const selectQstd = async () => {
  return await mariadb.query("selectQStandard");
};

// 품질기준변경
const updateQstd = async (b) => {
  const type = String(b.type ?? b.TYPE ?? b.STD_TYPE ?? "");
  const stdName = String(b.stdName ?? b.STD_NAME ?? "");
  const allowedValue = String(b.allowedValue ?? b.ALLOWED_VALUE ?? "");
  return await mariadb.query("UpdateQStandard", params);
};

// 품질기준추가
const insertQstd = async (payload) => {
  const {
    id, // ✅ PK 있으면 최우선
    type, // STD_TYPE
    stdName, // 변경될 STD_NAME
    allowedValue, // 변경될 ALLOWED_VALUE
    originalStdName, // 기존 STD_NAME (이름 바뀌는 경우 WHERE용)
  } = payload;

  if (!stdName || typeof allowedValue === "undefined") {
    return {
      ok: false,
      status: 400,
      msg: "필수값 누락(stdName, allowedValue)",
    };
  }

  if (id) {
    const [result] = await pool.execute(QSTD_SQL.updateById, [
      stdName,
      allowedValue,
      id,
    ]);
    return result.affectedRows > 0
      ? { ok: true, status: 200 }
      : { ok: false, status: 404, msg: "대상 없음(STD_ID)" };
  }

  // PK가 없으면 복합키로 처리
  if (!type || !originalStdName) {
    return {
      ok: false,
      status: 400,
      msg: "복합키 업데이트는 type, originalStdName 필요",
    };
  }

  const [result] = await pool.execute(QSTD_SQL.updateByComposite, [
    stdName,
    allowedValue,
    type,
    originalStdName,
  ]);

  return result.affectedRows > 0
    ? { ok: true, status: 200 }
    : { ok: false, status: 404, msg: "대상 없음(복합키)" };
};

// 품질공통코드
const qcCommonCode = async () => {
  let list = await mariadb.query("qcStatus");
  return list;
};

// 원자재 입고공통코드
const matCommonCode = async () => {
  let list = await mariadb.query("receiveStatus");
  return list;
};

module.exports = {
  matHisAll,
  matMng,
  addPassMat,
  addRejectMat,
  selectTaskPrd,
  selectPrdCert,
  addPassPrd,
  addRejectPrd,
  selectQstd,
  updateQstd,
  insertQstd,
  qcCommonCode,
  matCommonCode,
};
