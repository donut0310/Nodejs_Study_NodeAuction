// Package Modules
import passport from "passport";

// Custom Modules
import local from "./localStrategy.js";
import { User } from "../models/user.js";

export default () => {
  // 로그인시 실행 -> req.session 객체에 어떤 데이터를 저장할지
  passport.serializeUser((user, done) => {
    done(null, user.id); // 세션 용량과 데이터 일관성을 고려해 유저 아이디만 저장
  });

  passport.deserializeUser((id, done) => {
    User.findOne({ where: { id } })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });
  local();
};
