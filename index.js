require('dotenv').config();

const { Client } = require("pg");

// DB_URLを使用
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
console.log(process.env.DATABASE_URL)
// 接続
client.connect();

const query = {
  text: 'INSERT INTO m_hotels(hotel_name, hotel_number) VALUES ($1, $2)',
  values: ['東京ディズニーセレブレーションホテル', 151431]
}

client.query(query)
.then(client.end())
.catch(e => console.log("エラーです" +  e));

// client.query(query, (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   // 接続終了
//   client.end();
// });

// 現在時刻を取得
// client.query("SELECT * FROM M_HOTELS;", (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   // 接続終了
//   client.end();
// });

// const userId = "Hogeoisadhsdg";
// const hotelNumber = 1111;
// const cancelDate = 2023 - 03 - 01;

// const query = {
//   text:
//     "INSERT INTO t_cancels(user_id, hotel_number, date) VALUES ($1, $2, $3)",
//   values: [userId, hotelNumber, cancelDate],
// };

// client.query(query).then(client.end());
