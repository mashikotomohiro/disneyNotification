const line = require("@line/bot-sdk");
const express = require("express");
const https = require("https");
const {
  Client
} = require("pg");
const {
  promises
} = require("fs");
const {
  resolve
} = require("path");
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
  type: "hotel",
  hotelNumber: 74733,
  hotelName: "ミラコスタ",
};
const celebration = {
  type: "hotel",
  hotelNumber: 151431,
  hotelName: "セレブレーション",
};
const disneyLand = {
  type: "hotel",
  hotelNumber: 74732,
  hotelName: "ディズニーランドホテル",
};
const ambassador = {
  type: "hotel",
  hotelNumber: 72737,
  hotelName: "アンバサダーホテル",
};
const toyStory = {
  type: "hotel",
  hotelNumber: 183493,
  hotelName: "トイストーリーホテル",
};

const startService = (req) => {
  const start = {
    type: "start",
  };
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "template",
      altText: "確認いたしますので、少々お待ちください",
      template: {
        type: "buttons",
        title: "確認いたしますので少々お待ちください",
        text: "サービスを開始するには以下のボタンを押してください",
        actions: [{
          type: "postback",
          label: "スタート",
          data: JSON.stringify(start),
        }, ],
      },
    }, ],
  });
};

const selectService = (req) => {
  const register = {
    type: "register",
  };
  const check = {
    type: "check",
  };

  const unregisterService = {
    type: "unregisterService",
  };

  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "template",
      altText: "ご希望のサービスを教えてください",
      template: {
        type: "buttons",
        title: "ディズニーホテルキャンセル速報",
        text: "ご希望のサービスを教えてください",
        actions: [{
            type: "postback",
            label: "通知したいホテルと日付の登録",
            data: JSON.stringify(register),
          },
          {
            type: "postback",
            label: "通知ホテルの確認",
            data: JSON.stringify(check),
          },
          {
            type: "postback",
            label: "通知ホテルの削除",
            data: JSON.stringify(unregisterService),
          },
        ],
      },
    }, ],
  });
};

const selectRegisterHotel = (req) => {
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
        type: "template",
        altText: "ホテルを選択してください",
        template: {
          type: "buttons",
          title: "ディズニーホテル",
          text: "ディズニーホテルを選択してください",
          actions: [{
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
          actions: [{
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

const checkHotels = async (req) => {
  return new Promise((resolve) => {
    const userId = req.body.events[0].source.userId;
    const checkSql = {
      text: "select hotel_name, date from t_cancels join m_hotels on t_cancels.hotel_number = m_hotels.hotel_number where user_id = $1 order by created desc limit 3;",
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
          messages: [{
            type: "text",
            text: cancelText,
          }, ],
        })
      );
    });
  });
};

const selectUnregisterHotel = async (req) => {
  console.log("unregisterHotelのメソッドです")
  return new Promise((resolve) => {
    const userId = req.body.events[0].source.userId;
    const checkSql = {
      text: "select hotel_name, t_cancels.hotel_number, date from t_cancels join m_hotels on t_cancels.hotel_number = m_hotels.hotel_number where user_id = $1 order by created desc limit 3;",
      values: [userId],
    };
    db.doQuery(checkSql).then((cancels) => {
      let cancelText = "通知する日付とホテルです。\n";
      let cancelList = []
      for (let cancel of cancels.rows) {
        let cancelElement = {

        }
        const cancelDate = cancel["date"];
        const cancelYear = cancelDate.getFullYear().toString();
        const cancelMonth = (cancelDate.getMonth() + 1).toString();
        const cancelDay = cancelDate.getDate().toString();
        const formattedCancelDate = cancelMonth + "/" + cancelDay;
        const hotelName = cancel["hotel_name"];
        const hotelNumber = cancel["hotel_number"];
        cancelElement.type = "unregisterHotel"
        cancelElement.date = cancelYear + "-" + cancelMonth + "-" + cancelDay
        // cancelElement.hotelName = hotelName
        cancelElement.hotelNumber = hotelNumber
        cancelElement.label = formattedCancelDate + " " + hotelName
        cancelList.push(cancelElement)
      }
      console.log("それぞれのcancelList----------")
      console.log(cancelList[0])
      console.log(cancelList[1])
      console.log(cancelList[2])
      resolve(
        JSON.stringify({
          replyToken: req.body.events[0].replyToken,
          messages: [{
            type: "template",
            altText: "解除するホテル日時を選択してください",
            template: {
              type: "buttons",
              title: "ホテル登録解除",
              text: "通知解除するホテル日時を選択してください",
              actions: [{
                  type: "postback",
                  label: cancelList[0].label,
                  data: JSON.stringify(cancelList[0])
                },
                {
                  type: "postback",
                  label: cancelList[1].label,
                  data: JSON.stringify(cancelList[1])
                },
                {
                  type: "postback",
                  label: cancelList[2].label,
                  data: JSON.stringify(cancelList[2])
                },
              ]

            }
          }, ],
        })
      );
    });
  });
}

const confirmUnregister = (req) => {
  const hoge = req.body.events[0].postback.data;
  const unregisterHotel = JSON.parse(req.body.events[0].postback.data).label;
  console.log(hoge)
  console.log("----")
  console.log(unregisterHotel)
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "text",
      text: unregisterHotel + "の通知登録を解除しました。"
    }, ],
  });
}


const confirmHotel = (req) => {
  const cancelDate = req.body.events[0].postback.params.date;
  const formattedCancelDate = cancelDate.replaceAll("-", "/");
  const hotel = JSON.parse(req.body.events[0].postback.data);
  const hotelName = hotel.hotelName;
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "text",
      text: formattedCancelDate +
        " " +
        hotelName +
        "のキャンセルが出たら通知します。",
    }, ],
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
    dataString = startService(req);
    request.write(dataString);
    request.end();
  }

  if (req.body.events[0].type == "postback") {
    const postbackData = JSON.parse(req.body.events[0].postback.data);
    if (postbackData.type == "start") {
      dataString = selectService(req);
    } else if (postbackData.type == "hotel") {
      console.log("hotelきたよ");
      const cancelDate = req.body.events[0].postback.params.date;
      const hotel = JSON.parse(req.body.events[0].postback.data);
      const hotelNumber = hotel.hotelNumber;
      const userId = req.body.events[`0`].source.userId;
      dataString = confirmHotel(req);
      const insertSql = {
        text: "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
        values: [userId, hotelNumber, cancelDate],
      };
      await db.doQuery(insertSql);
    } else if (postbackData.type == "register") {
      dataString = selectRegisterHotel(req);
    } else if (postbackData.type == "check") {
      dataString = await checkHotels(req);
    } else if (postbackData.type == "unregisterService") {
      console.log("unregisterServiceです")
      dataString = await selectUnregisterHotel(req)
    } else if (postbackData.type == "unregisterHotel") {
      console.log("unregisterHotelです")
      console.log(postbackData)
      dataString = confirmUnregister(req)
      console.log("登録解除の確認dataString完")
      console.log(postbackData.hotelNumber, postbackData.date)
      const deleteSql = {
        text: "DELETE from t_cancels where hotel_number = $1 AND date = $2",
        values: [postbackData.hotelNumber, postbackData.date],
      }
      await db.doQuery(deleteSql)
    }
    request.write(dataString);
    request.end();
  }

  // 友達追加またはブロック解除時
  // 「登録は3件まででそれ以降は自動的に更新されます」みたいな文言を入れる
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
    dataString = selectRegisterHotel(req);
    // データを送信
    request.write(dataString);
    request.end();
  }
}