const line = require("@line/bot-sdk");
const express = require("express");
const https = require("https");
// const {
//   Client
// } = require("pg");
const {
  promises
} = require("fs");
const {
  resolve
} = require("path");
require("dotenv").config();
const db = require("./db");
// const { default: axios } = require("axios");
const axios = require("axios");
const delay = require("delay");



const CONFIG = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(CONFIG);

const rakutenId = process.env.RAKUTEN_TRAVEL_VACANT_HOTEL_API_KEY;

const PORT = 3000;

const baseUrl =
  "https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426";

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

const quickReply = {
  items: [{
      type: "action",
      action: {
        type: "uri",
        label: "ミラコスタ",
        uri: "https://a.r10.to/hu55CP"
      }
    },
    {
      type: "action",
      action: {
        type: "uri",
        label: "セレブレーション",
        uri: "https://a.r10.to/hUB4cz"
      }
    },
    {
      type: "action",
      action: {
        type: "uri",
        label: "ディズニーランドホテル",
        uri: "https://a.r10.to/hU0x8T"
      }
    },
    {
      type: "action",
      action: {
        type: "uri",
        label: "アンバサダー",
        uri: "https://a.r10.to/hNcVzH"
      }
    },
    {
      type: "action",
      action: {
        type: "uri",
        label: "トイストーリー",
        uri: "https://a.r10.to/hkZrIb"
      }
    }
  ]
}

// const startService = (req) => {
//   const start = {
//     type: "start",
//   };
//   return JSON.stringify({
//     replyToken: req.body.events[0].replyToken,
//     messages: [{
//       type: "template",
//       altText: "確認いたしますので、少々お待ちください",
//       template: {
//         type: "buttons",
//         title: "確認いたしますので少々お待ちください",
//         text: "サービスを開始するには以下のボタンを押してください",
//         actions: [{
//           type: "postback",
//           label: "スタート",
//           data: JSON.stringify(start),
//         }, ],
//       },
//     }, ],
//   });
// };

// どのサービスを使うか選択
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
      quickReply: quickReply,
      template: {
        type: "buttons",
        title: "ディズニーホテルキャンセル速報",
        text: "ご希望のサービスを教えてください",
        actions: [{
            type: "postback",
            label: "ホテルと日付の登録",
            // データのタイプ
            data: JSON.stringify(register),
          },
          {
            type: "postback",
            label: "ホテルの確認と削除",
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
        quickReply: quickReply,
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
        quickReply: quickReply,
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

// 通知解除するホテルの選択
const selectUnregisterHotel = async (req) => {
  console.log("unregisterHotelのメソッドです");
  const userId = req.body.events[0].source.userId;
  const checkSql = {
    text: "select hotel_name, t_cancels.hotel_number, date from t_cancels join m_hotels on t_cancels.hotel_number = m_hotels.hotel_number where user_id = $1 order by created desc limit 3;",
    values: [userId],
  };
  const cancels = await db.doQuery(checkSql);
  let cancelText = "通知する日付とホテルです。\n";
  let cancelList = [];
  for (let cancel of cancels.rows) {
    let cancelElement = {};
    const cancelDate = cancel["date"];
    const cancelYear = cancelDate.getFullYear().toString();
    const cancelMonth = (cancelDate.getMonth() + 1).toString();
    const cancelDay = cancelDate.getDate().toString();
    const checkoutDay = (cancelDate.getDate() + 1).toString().padStart(2, "0");
    const formattedCancelDate = cancelMonth + "/" + cancelDay;
    const hotelName = cancel["hotel_name"];
    const hotelNumber = cancel["hotel_number"];
    const requestCheckinDate = cancelYear + "-" + cancelMonth + "-" + cancelDay;
    const requestCheckoutDate =
      cancelYear + "-" + cancelMonth + "-" + checkoutDay;
    cancelElement.date = cancelYear + "-" + cancelMonth + "-" + cancelDay;
    let requestUrl = new URL(baseUrl);
    requestUrl.searchParams.set("checkinDate", requestCheckinDate);
    requestUrl.searchParams.set("checkoutDate", requestCheckoutDate);
    requestUrl.searchParams.set("hotelNo", hotelNumber);
    requestUrl.searchParams.set("applicationId", rakutenId);
    requestUrl.searchParams.set("format", "json");
    const today = new Date();
    let vacant = "";
    try {
      if (cancelDate < today) {
        throw new Error();
      }
      await delay(1000);
      res = await axios.get(requestUrl.href);
      vacant = "空き◯";
      cancelElement.vacant = vacant;
    } catch (e) {
      vacant = "空き×";
      cancelElement.vacant = vacant;
    }

    cancelElement.type = "unregisterHotel";

    // cancelElement.hotelName = hotelName
    cancelElement.hotelNumber = hotelNumber;
    cancelElement.label = formattedCancelDate + " " + hotelName + " " + vacant;
    cancelList.push(cancelElement);
  }
  console.log("それぞれのcancelList----------");
  console.log(cancelList[0]);
  console.log(cancelList[1]);
  console.log(cancelList[2]);

  let registerHotel = "";
  if (cancelList.length == 0) {
    registerHotel = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [{
        type: "text",
        text: "登録しているホテルがありません",
      }, ],
    });
  }
  if (cancelList.length == 1) {
    registerHotel = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [{
        type: "template",
        altText: "解除するホテル日時を選択してください",
        quickReply: quickReply,
        template: {
          type: "buttons",
          title: "ホテル登録解除",
          text: "通知解除するホテル日時を選択してください",
          actions: [{
            type: "postback",
            label: cancelList[0].label,
            data: JSON.stringify(cancelList[0]),
          }, ],
        },
      }, ],
    });
  }

  if (cancelList.length == 2) {
    registerHotel = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [{
        type: "template",
        altText: "解除するホテル日時を選択してください",
        quickReply: quickReply,
        template: {
          type: "buttons",
          title: "ホテル登録解除",
          text: "通知解除するホテル日時を選択してください",
          actions: [{
              type: "postback",
              label: cancelList[0].label,
              data: JSON.stringify(cancelList[0]),
            },
            {
              type: "postback",
              label: cancelList[1].label,
              data: JSON.stringify(cancelList[1]),
            },
          ],
        },
      }, ],
    });
  }

  if (cancelList.length == 3) {
    registerHotel = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [{
        type: "template",
        altText: "解除するホテル日時を選択してください",
        quickReply: quickReply,
        template: {
          type: "buttons",
          title: "ホテル登録解除",
          text: "通知解除するホテル日時を選択してください",
          actions: [{
              type: "postback",
              label: cancelList[0].label,
              data: JSON.stringify(cancelList[0]),
            },
            {
              type: "postback",
              label: cancelList[1].label,
              data: JSON.stringify(cancelList[1]),
            },
            {
              type: "postback",
              label: cancelList[2].label,
              data: JSON.stringify(cancelList[2]),
            },
          ],
        },
      }, ],
    });
  }

  return registerHotel;
};

// ボタンプッシュ後、再プッシュしないようメッセージを送信
const waitMessage = async (req) => {
  const hoge = {
    type: "hogehoge"
  };
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "postback",
      label: "hoge",
      text: "確認します。少々お待ちください。",
      data: JSON.stringify(hoge)
      // type: "text",
      // text: "確認します。少々お待ちください。",
      // altText: "解除するホテル日時を選択してください",
      // template: {
      //   type: "text",
      //   title: "hogehoge",
      //   text: "コンちゃす",
      //   actions: {
      //     type: "postback",
      //     data: JSON.stringify(hoge)
      //   }
      // }
    }]
  })
}

// 通知を解除するメッセージ
const confirmUnregister = (req) => {
  const hoge = req.body.events[0].postback.data;
  const unregisterHotel = JSON.parse(req.body.events[0].postback.data).label;
  console.log(hoge);
  console.log("----");
  console.log(unregisterHotel);
  return JSON.stringify({
    replyToken: req.body.events[0].replyToken,
    messages: [{
      type: "text",
      text: unregisterHotel + "の通知を解除しました。",
    }, ],
  });
};

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
      quickReply: quickReply,
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
    // dataString = startService(req);
    dataString = selectService(req);
    request.write(dataString);
    request.end();
  }

  if (req.body.events[0].type == "postback") {
    console.log(req.body.events[0])
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
      console.log("unregisterServiceです");
      dataString = await selectUnregisterHotel(req);
    } else if (postbackData.type == "unregisterHotel") {
      console.log("unregisterHotelです");
      console.log(postbackData);
      dataString = confirmUnregister(req);
      console.log("登録解除の確認dataString完");
      console.log(postbackData.hotelNumber, postbackData.date);
      const deleteSql = {
        text: "DELETE from t_cancels where hotel_number = $1 AND date = $2",
        values: [postbackData.hotelNumber, postbackData.date],
      };
      await db.doQuery(deleteSql);
    }
    request.write(dataString);
    request.end();
  }

  if (req.body.events[0].type == "follow") {}
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