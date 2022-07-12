// Package Modules
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import schedule from "node-schedule";

// Custom Modules
import { isLoggedIn, isNotLoggedIn } from "./middlewares.js";
import { Good } from "../models/good.js";
import { Auction } from "../models/auction.js";
import { User } from "../models/user.js";
import sequelize from "sequelize";

export const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// 메인 페이지: 경매 진행 목록 데이터 불러오기
router.get("/", async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null } });
    res.render("main", {
      title: "NodeAuction",
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 회원가입
router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", {
    title: "회원가입 - NodeAuction",
  });
});

// 상품등록 페이지
router.get("/good", isLoggedIn, (req, res) => {
  res.render("good", { title: "상품 등록 - NodeAuction" });
});

// 상품 이미지 등록
try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(
        null,
        path.basename(file.originalname, ext) + new Date().valueOf() + ext
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 상품 등록: 경매시간 조정 추가하기
router.post(
  "/good",
  isLoggedIn,
  upload.single("img"),
  async (req, res, next) => {
    try {
      const { name, price, time } = req.body;
      const good = await Good.create({
        OwnerId: req.user.id,
        name,
        img: req.file.filename,
        price,
        time,
      });
      const end = time;
      // 실행될 시각, 수행할 콜백함수
      schedule.scheduleJob(end, async () => {
        // 입찰가가 가장 높은 사람
        const success = await Auction.findOne({
          where: { GoodId: good.id },
          order: [["bid", "DESC"]],
        });
        await Good.update(
          { SoldId: success.UserId },
          { where: { id: good.id } }
        );
        await User.update(
          { money: sequelize.literal(`money - ${success.bid}`) }, //sequelisze에서 해당 컬럼의 숫자 줄이는 방법
          { where: { id: success.UserId } }
        );
      });
      res.redirect("/");
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

// 경매방 입장: 상품정보와, 기존 입찰 정보 조회
router.get("/good/:id", isLoggedIn, async (req, res, next) => {
  try {
    const [good, auction] = await Promise.all([
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: "Owner",
        },
      }),
      Auction.findAll({
        where: { GoodId: req.params.id },
        include: { model: User },
        order: [["bid", "ASC"]],
      }),
    ]);
    if (req.user.id === good.OwnerId) {
      return res.status(403).send("상품 등록자는 경매에 참여할 수 없습니다.");
    }
    res.render("auction", {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 클라이언트로부터 받은 입찰 정보 저장
router.post("/good/:id/bid", isLoggedIn, async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model: Auction }, "bid", "DESC"]],
    });
    if (good.price >= bid) {
      return res.status(403).send("시작 가격보다 높게 입찰해야 합니다.");
    }
    if (new Date(good.createdAt).valueOf() + 24 * 60 * 60 * 1000 < new Date()) {
      return res.status(403).send("경매가 이미 종료되었습니다");
    }
    if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
      return res.status(403).send("이전 입찰가보다 높아야 합니다");
    }
    const result = await Auction.create({
      bid,
      msg,
      UserId: req.user.id,
      GoodId: req.params.id,
    });
    // 실시간으로 입찰 내역 전송
    req.app.get("io").to(req.params.id).emit("bid", {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send("ok");
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 사용자 낙찰내역 조회
router.get("/list", isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: { SoldId: req.user.id },
      include: { model: Auction },
      order: [[{ model: Auction }, "bid", "DESC"]],
    });
    res.render("list", { title: "낙찰 목록 - NodeAuction", goods });
  } catch (error) {
    console.error(error);
    next(error);
  }
});
