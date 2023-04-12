const vacants = require('./vacants.js');
const monitor = require('./monitor.js');
const express = require("express");
const line = require("@line/bot-sdk");

const miraCostaClient = {
  consumer_key: process.env.USJ_CONSUMER_KEY,
  consumer_secret: process.env.USJ_CONSUMER_SECRET,
  access_token_key: process.env.USJ_ACCESS_TOKEN,
  access_token_secret: process.env.USJ_ACCESS_TOKEN_SECRET
};

const disneyClient = {
  consumer_key: process.env.MY_CONSUMER_KEY,
  consumer_secret: process.env.MY_CONSUMER_SECRET,
  access_token_key: process.env.MY_ACCESS_TOKEN,
  access_token_secret: process.env.MY_ACCESS_TOKEN_SECRET
};

const CONFIG = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const PORT = 3000;


// ----ここから修正

const disneyHotels = [{name: 'ミラコスタ', number: 74733}, {name: '東京ディズニーセレブレーションホテル', number: 151431}, {name: '東京ディズニーランドホテル', number: 74732}, {name: 'ディズニーアンバサダーホテル', number: 72737}, {name: 'トイストーリーホテル', number: 183493}]
const usjHotels = [{name: "ホテルユニバーサルポート ヴィータ", number: 166138}, {name: "ザ パークフロントホテル アット ユニバーサル・スタジオ・ジャパン", number: 147805}, {name: "ホテルユニバーサルポート", number: 38281}, {name: "リーベルホテル アット ユニバーサル・スタジオ・ジャパン", number: 17237}]

const disneyHashtagText = "#ディズニーホテル #予約 "


const targetHotels = [{outline: 'ディズニー', hotels: disneyHotels, hashtagText: disneyHashtagText, client: disneyClient, miraCostaClient: miraCostaClient, userName: "@disney_htl\n"}];

express()
  .post("/webhook", line.middleware(CONFIG), (req, res) => monitor.handleBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


vacants.search(targetHotels)