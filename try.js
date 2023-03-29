
const db = require("./db");
const express = require("express");
const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
})


const sendLine = async (cancelDate) => {
  console.log(cancelDate)
  console.log(cancelDate.number)
  // データベースからキャンセル登録している人を探す
  // その人にメッセージを送る
  const findUserSql = {
    text: "SELECT * from t_cancels join m_hotels on t_cancels.hotel_number = m_hotels.hotel_number where t_cancels.hotel_number = $1 and t_cancels.date = $2",
    values: [cancelDate.number, cancelDate.date]
  }
  console.log(findUserSql)
  const sendUsers = await db.doQuery(findUserSql);
  for(let user of sendUsers.rows) {
    const userId = user["user_id"]
    const date = user["date"]
    const cancelYear = date.getFullYear().toString();
    const cancelMonth = (date.getMonth() + 1).toString();
    const cancelDay = date.getDate().toString();
    const formattedCancelDate = cancelMonth + "/" + cancelDay;
    const hotelName = user["hotel_name"]

    client.pushMessage(userId, [
      {
        type: "text",
        text: formattedCancelDate + ":" + hotelName + "でキャンセルが出ました" 
      }
    ])
    .catch((err) => {
      console.log(err + "エラーです")
    });

  }
}

const cancelDate = {
  number: 74733,
  date: "2023-07-15"
}

sendLine(cancelDate)

