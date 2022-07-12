import Op from "sequelize";

import { Good } from "./models/good.js";
import { Auction } from "./models/auction.js";
import { User } from "./models/user.js";
import { sequelize } from "./models/index.js";

export default async () => {
  console.log("checkAuction");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // 어제 시간
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: { [Op.lte]: yesterday },
      },
    });
    targets.forEach(async (target) => {
      const success = await Auction.findOne({
        where: { GoodId: target.id },
        order: [["bid", "DESC"]],
      });
      await Good.update(
        { SoldId: success.UserId },
        { where: { id: target.id } }
      );
      await User.update(
        {
          money: sequelize.literal(`money - ${success.bid}`),
        },
        {
          where: { id: success.UserId },
        }
      );
    });
  } catch (error) {
    console.error(error);
  }
};
