// const line = require("@line/bot-sdk");
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
require('dotenv').config();
const Promise = require ('promise')


// connectionString: process.env.DATABASE_URL,
// ssl: {
//   rejectUnauthorized: false,
// },
// });
// client.connect();
// const query = {
// text: "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
// values: [userId, hotelNumber, cancelDate],
// };
// client.query(query, (err, res) => {
// if (err) throw err;
// for (let row of res.rows) {
//   console.log(JSON.stringify(row));
// }
// // 接続終了
// client.end();
const getPgClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })
}
exports.doQuery = (sql) => {
  console.log(0)
  return new Promise((resolve) => {
    const client = getPgClient()
    client.connect()
      .then(() => {
        client.query(sql)
          .then((result) => {
            client.end()
            .then(() => {
              resolve(result)
            })
          })
          .catch((err) => {
            console.log(err)
          })
      })
      .catch((err) => {
        console.log(err);
      })
  })
}

// export default {
//   getPgClient,
//   doQuery
// }

// const CONFIG = {
//   channelAccessToken: process.env.LINE_ACCESS_TOKEN,
//   channelSecret: process.env.LINE_CHANNEL_SECRET,
// };

// const PORT = 3000;

// let date = new Date();
// let year = date.getFullYear().toString();
// let maxYear = (date.getFullYear() + 1).toString();
// let month = (date.getMonth() + 1).toString().padStart(2, "0");
// let day = date.getDate().toString().padStart(2, "0");
// let minFormattedDate = year + "-" + month + "-" + day;
// let maxFormattedDate = maxYear + "-" + month + "-" + day;

// console.log('hoge')
// express()
//   .post("/webhook", line.middleware(CONFIG), (req, res) => handleBot(req, res))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));

// async function handleBot(req, res) {
//   await res.status(200).end();
//   await req.body.events.map((event) => {
//     console.log("event", event);
//   });

//   let dataString = "";
//   // リクエストヘッダー
//   const headers = {
//     "Content-Type": "application/json",
//     Authorization: "Bearer " + process.env.LINE_ACCESS_TOKEN,
//   };

//   // リクエストに渡すオプション
//   const webhookOptions = {
//     hostname: "api.line.me",
//     path: "/v2/bot/message/reply",
//     method: "POST",
//     headers: headers,
//     body: dataString,
//   };

//   // リクエストの定義
//   const request = https.request(webhookOptions, (res) => {
//     res.on("data", (d) => {
//       process.stdout.write(d);
//     });
//   });

//   // エラーをハンドル
//   request.on("error", (err) => {
//     console.log("エラー");
//     console.error(err);
//   });

//   // メッセージ取得時
//   if (req.body.events[0].type === "message") {
//     console.log("メッセージです");
//     console.log(req.body);
//     if (
//       req.body.events[0].message.text == "ミラコスタ" ||
//       req.body.events[0].message.text == "セレブレーション"
//     ) {
//       const hotelName = req.body.events[0].message.text;
//       console.log("メッセージ受けたよ");
//       dataString = JSON.stringify({
//         replyToken: req.body.events[0].replyToken,
//         messages: [{
//           type: "template",
//           altText: "datetime_picker",
//           template: {
//             type: "buttons",
//             title: hotelName,
//             text: "キャンセル通知したい日付を選択してください。",
//             actions: [{
//               type: "datetimepicker",
//               label: "Select date",
//               data: hotelName,
//               mode: "date",
//               initial: minFormattedDate,
//               max: maxFormattedDate,
//               min: minFormattedDate,
//             }, ],
//           },
//         }, ],
//       });
//       // データを送信
//       request.write(dataString);
//       request.end();
//     } else {
//       // 選択肢
//     }
//   }

//   if (req.body.events[0].type == "postback") {
//     console.log("postBack");
//     console.log(req.body);
//     console.log('sourceです')
//     console.log(req.body.events[0].source);
//     console.log("----------");
//     console.log(req.body.events[0].postback);
//     const cancelDate = req.body.events[0].postback.params.date;
//     const formattedCancelDate = cancelDate.replaceAll("-", "/");
//     const hotel = JSON.parse(req.body.events[0].postback.data);
//     const hotelName = hotel.hotelName;
//     const hotelNumber = hotel.hotelNumber;
//     console.log(hotel);
//     console.log(hotelName);
//     console.log(hotelNumber);
//     const userId = req.body.events[0].source.userId;

//     // const hotelNumber =
//     dataString = JSON.stringify({
//       replyToken: req.body.events[0].replyToken,
//       messages: [{
//         type: "text",
//         text: formattedCancelDate +
//           " " +
//           hotelName +
//           "のキャンセルが出たら通知します。",
//       }, ],
//     });

//     // DB_URLを使用
//     const client = new Client({
//       connectionString: process.env.DATABASE_URL,
//       ssl: {
//         rejectUnauthorized: false,
//       },
//     });
//     client.connect();
//     const query = {
//       text: "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
//       values: [userId, hotelNumber, cancelDate],
//     };
//     client.query(query, (err, res) => {
//       if (err) throw err;
//       for (let row of res.rows) {
//         console.log(JSON.stringify(row));
//       }
//       // 接続終了
//       client.end();
//     });
//     console.log("requestWrite");
//     request.write(dataString);
//     request.end();
//   }

//   // 友達追加またはブロック解除時
//   if (req.body.events[0].type == "follow") {
//     console.log("フォローされました");
//     const miraCosta = {
//       "hotelNumber": 74733,
//       "hotelName": "ミラコスタ"
//     };
//     const celebration = {
//       "hotelNumber": 151431,
//       "hotelName": "セレブレーション"
//     }
//     date = new Date();
//     console.log(date);
//     dataString = JSON.stringify({
//       replyToken: req.body.events[0].replyToken,
//       messages: [{
//         type: "template",
//         altText: "ホテルを選択してください",
//         template: {
//           type: "buttons",
//           title: "ディズニーホテル",
//           text: "ディズニーホテルを選択してください",
//           actions: [{
//               type: "datetimepicker",
//               label: "ミラコスタ",
//               data: JSON.stringify(miraCosta),
//               mode: "date",
//               initial: minFormattedDate,
//               max: maxFormattedDate,
//               min: minFormattedDate,
//             },
//             {
//               type: "datetimepicker",
//               label: "セレブレーション",
//               data: JSON.stringify(celebration),
//               mode: "date",
//               initial: minFormattedDate,
//               max: maxFormattedDate,
//               min: minFormattedDate,
//             },
//           ],
//         },
//       }, ],
//     });
//     // データを送信
//     request.write(dataString);
//     request.end();
//   }
// }