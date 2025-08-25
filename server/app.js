const express = require("express");
const cors = require("cors");
const session = require("express-session");

require("dotenv").config({ path: "./database/dbconfig.env" });

const app = express();
const PORT = 3000;

let sessionSetting = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 60000,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173", // 프론트 주소
    credentials: true, // 쿠키/세션 공유 허용
  })
);

app.use(express.json());
app.use(sessionSetting);

app.listen(PORT, () => {
  console.log(`✅ Node 서버 실행: http://localhost:${PORT}`);
});

const boardRouter = require("./routers/board_router.js");
app.use("/api", boardRouter);

// 생산
const productionRouter = require("./routers/production_router.js");
app.use("/api", productionRouter);

// 품질
const qualityRouter = require("./routers/quality_router.js");
app.use("/api", qualityRouter);
const MasterRouter = require("./routers/master_router.js");
app.use("/api", MasterRouter);
const MaterialsRouter = require("./routers/materials_router.js");
app.use("/api", MaterialsRouter);

//영업
const marketingRouter = require("./routers/marketingRouter.js");
app.use("/api", marketingRouter);

// f로그인
const loginRouter = require("./routers/login_router.js");
app.use("/api", loginRouter);

//설비
const FacilityRouter = require("./routers/facility_router.js");
app.use("/api", FacilityRouter);

//기준정보
const kijunRouter = require("./routers/master_router.js");
app.use("/api", kijunRouter);

// vue.js build 이후

const path = require("path");
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.get("/", function (req, res, next) {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./public", "index.html"));
});
