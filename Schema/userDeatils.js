const mongo = require("mongoose");

const userDeatils = new mongo.Schema(
  {
    email: { type: String, unique: true },
    pass: String,
  },
  {
    collection: "UserInfo",
  }
);

mongo.model("UserInfo", userDeatils);
