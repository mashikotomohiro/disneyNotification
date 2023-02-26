const line = require("@line/bot-sdk");
const express = require("express");
const https = require("https");
const { Client } = require("pg");
const { promises } = require("fs");
const { resolve } = require("path");
require("dotenv").config();
const db = require("./db");

const CONFIG = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const PORT = 3000;

let date = new Date();
let year = date.getFullYear().toString();
let maxYear = (date.getFullYear() + 1).toString();
let month = (date.getMonth() + 1).toString().padStart(2, "0");
let day = date.getDate().toString().padStart(2, "0");
let minFormattedDate = year + "-" + month + "-" + day;
let maxFormattedDate = maxYear + "-" + month + "-" + day;
const miraCosta = {
  type: "register",
  hotelNumber: 74733,
  hotelName: "ミラコスタ",
};
const celebration = {
  type: "register",
  hotelNumber: 151431,
  hotelName: "セレブレーション",
};
const disneyLand = {
  hotelNumber: 74732,
  hotelName: "ディズニーランドホテル",
};
const ambassador = {
  type: "register",
  hotelNumber: 72737,
  hotelName: "アンバサダーホテル",
};
const toyStory = {
  type: "register",
  hotelNumber: 183493,
  hotelName: "トイストーリーホテル",
};

const registerDataString = (req) => {
  const cancelDate = req.body.events[0].postback.params.date;
  const formattedCancelDate = cancelDate.replaceAll("-", "/");
  const hotel = JSON.parse(req.body.events[0].postback.data);
  const hotelName = hotel.hotelName;
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [
      {
        type: "text",
        text:
          formattedCancelDate +
          " " +
          hotelName +
          "のキャンセルが出たら通知します。",
      },
    ],
  });
};

const selectDataString = (req) => {
  console.log("selectDataString始まります");
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [
      {
        type: "template",
        altText: "ホテルを選択してください",
        template: {
          type: "buttons",
          title: "ディズニーホテル",
          text: "ディズニーホテルを選択してください",
          actions: [
            {
              type: "datetimepicker",
              label: miraCosta.hotelName,
              data: JSON.stringify(miraCosta),
              mode: "date",
              initial: minFormattedDate,
              max: maxFormattedDate,
              min: minFormattedDate,
            },
            {
              type: "datetimepicker",
              label: celebration.hotelName,
              data: JSON.stringify(celebration),
              mode: "date",
              initial: minFormattedDate,
              max: maxFormattedDate,
              min: minFormattedDate,
            },
            {
              type: "datetimepicker",
              label: disneyLand.hotelName,
              data: JSON.stringify(disneyLand),
              mode: "date",
              initial: minFormattedDate,
              max: maxFormattedDate,
              min: minFormattedDate,
            },
          ],
        },
      },
      {
        type: "template",
        altText: "ホテルを選択してください",
        template: {
          type: "buttons",
          title: "ディズニーホテル",
          text: "ディズニーホテルを選択してください",
          actions: [
            {
              type: "datetimepicker",
              label: ambassador.hotelName,
              data: JSON.stringify(ambassador),
              mode: "date",
              initial: minFormattedDate,
              max: maxFormattedDate,
              min: minFormattedDate,
            },
            {
              type: "datetimepicker",
              label: toyStory.hotelName,
              data: JSON.stringify(toyStory),
              mode: "date",
              initial: minFormattedDate,
              max: maxFormattedDate,
              min: minFormattedDate,
            },
          ],
        },
      },
    ],
  });
};

const checkDataString = async (req) => {
  console.log("check始まります");
  return new Promise((resolve) => {
    const userId = req.body.events[0].source.userId;
    const checkSql = {
      text:
        "select hotel_name, date from t_cancels join m_hotels on t_cancels.hotel_number = m_hotels.hotel_number where user_id = $1 order by created desc limit 3;",
      values: [userId],
    };
    db.doQuery(checkSql).then((cancels) => {
      let cancelText = "通知する日付とホテルです。\n";
      for (let cancel of cancels.rows) {
        const cancelDate = cancel["date"];
        const cancelYear = cancelDate.getFullYear().toString();
        const cancelMonth = (cancelDate.getMonth() + 1).toString();
        const cancelDay = cancelDate.getDate().toString();
        const formattedCancelDate =
          cancelYear + "/" + cancelMonth + "/" + cancelDay;
        console.log(formattedCancelDate);
        cancelText += formattedCancelDate + " ";
        cancelText += cancel["hotel_name"] + "\n";
      }
      resolve(
        JSON.stringify({
          replyToken: req.body.events[0].replyToken,
          messages: [
            {
              type: "text",
              text: cancelText,
            },
          ],
        })
      );
    });
  });
};

const inquryDataString = (req) => {
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    // ここにpostbackの内容を追記する
    messages: [
      {
        type: "text",
        text: "お問い合わせ内容を教えてください！",
      },
    ],
  });
};

// 処理開始
express()
  .post("/webhook", line.middleware(CONFIG), (req, res) => handleBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

async function handleBot(req, res) {
  await res.status(200).end();
  await req.body.events.map((event) => {
    console.log("event", event);
  });

  let dataString = "";
  // リクエストヘッダー
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + process.env.LINE_ACCESS_TOKEN,
  };

  // リクエストに渡すオプション
  const webhookOptions = {
    hostname: "api.line.me",
    path: "/v2/bot/message/reply",
    method: "POST",
    headers: headers,
    body: dataString,
  };

  // リクエストの定義
  const request = https.request(webhookOptions, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  // エラーをハンドル
  request.on("error", (err) => {
    console.log("エラー");
    console.error(err);
  });

  if (req.body.events[0].type === "message") {
    // 
    console.log("メッセージきました");
    const select = {
      type: "select",
    };
    const check = {
      type: "check",
    };
    const inqury = {
      type: "inqury",
    };
    dataString = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [
        {
          type: "template",
          altText: "ご希望のサービスを教えてください",
          template: {
            type: "buttons",
            title: "ディズニーホテルキャンセル速報",
            text: "ご希望のサービスを教えてください",
            actions: [
              {
                type: "postback",
                label: "通知したいホテルと日付の登録",
                data: JSON.stringify(select),
              },
              {
                type: "postback",
                label: "通知ホテルの確認と削除",
                data: JSON.stringify(check),
              },
              {
                type: "postback",
                label: "問い合わせ",
                data: JSON.stringify(inqury),
              },
            ],
          },
        },
      ],
    });

    request.write(dataString);
    request.end();
  }

  if (req.body.events[0].type == "postback") {
    const postbackData = JSON.parse(req.body.events[0].postback.data);
    if (postbackData.type == "register") {
      console.log("registerきたよ");
      const cancelDate = req.body.events[0].postback.params.date;
      const hotel = JSON.parse(req.body.events[0].postback.data);
      const hotelNumber = hotel.hotelNumber;
      const userId = req.body.events[`0`].source.userId;
      dataString = registerDataString(req);
      const insertSql = {
        text:
          "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
        values: [userId, hotelNumber, cancelDate],
      };
      await db.doQuery(insertSql);
    } else if (postbackData.type == "select") {
      console.log("selectされました");
      dataString = selectDataString(req);
      console.log("dataStringの処理が終わった");
    } else if (postbackData.type == "check") {
      dataString = await checkDataString(req);
      console.log("check");
    } else if (postbackData.type == "inqury") {
      console.log("inqury");
      dataString = inquryDataString(req);
    }
    request.write(dataString);
    request.end();
  }

  // 友達追加またはブロック解除時
  if (req.body.events[0].type == "follow") {
    console.log("フォローされました");
    console.log(req.body.events);
    const userId = req.body.events[0].source.userId;
    // 新しいユーザーがいたらユーザーテーブルにユーザーを追加
    const countSql = {
      text: "SELECT COUNT(*) FROM m_users WHERE user_id = $1",
      values: [userId],
    };
    const countsData = await db.doQuery(countSql);
    const count = countsData.rows[0]["count"];
    if (count == 0) {
      const addSql = {
        text: "INSERT INTO m_users(user_id) VALUES ($1)",
        values: [userId],
      };
      await db.doQuery(addSql);
    }

    date = new Date();
    dataString = selectDataString(req);
    // データを送信
    request.write(dataString);
    request.end();
  }
}
