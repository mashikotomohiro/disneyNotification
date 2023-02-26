
// const monitor = require('./monitor');

// console.log(monitor.monitor)


const hoge = require('./hoge');


const mashi = hoge.getPgClient()

console.log(mashi)
// // const { Pool } = require('pg');

// // const client = new Client({
// //   connectionString: process.env.DATABASE_URL,
// //   ssl: {
// //     rejectUnauthorized: false,
// //   },
// // });

// require('dotenv').config();

// const { Client } = require('pg');

// // DB_URLを使用
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// // 接続
// client.connect();

// // クエリ
// // const query = {
// //   // text: 'INSERT INTO m_hotels(hotel_name, hotel_number) VALUES ($1, $2)',
// //   text: 'SELECT * FROM M_HOTELS'
// //   // values: ['東京ディズニーセレブレーションホテル', 151431]
// // }

// const userId = "Udb72d201538a5208b82d2408397f756e";
// const hotelNumber = 74733;
// const cancelDate = "2023-02-15";
// const query = {
//   text: "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
//   values: [userId, hotelNumber, cancelDate],
// };

// // 現在時刻を取得
// client.query(query, (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   // 接続終了
//   client.end();
// });