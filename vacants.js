const puppeteer = require('puppeteer');
const fs = require('fs');
let twitter = require('twitter');

const delay = require('delay');
const baseUrl = 'https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426'
const rakutenId = process.env.RAKUTEN_TRAVEL_VACANT_HOTEL_API_KEY
const affiliateId = process.env.RAKUTEN_AFFILIATE_ID
const baseAffiliateUrl = "http://hb.afl.rakuten.co.jp/hgc/" + affiliateId + "/"
const planUrl = "https://hotel.travel.rakuten.co.jp/hotelinfo/plan/"
const axios = require('axios');
const https = require('https');
const db = require("./db");
const { text } = require('express');
const line = require("@line/bot-sdk");
const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
})

const getVacants = async (hotelNames, hotelNumbers) => {
  vacants = []
  let today = new Date();
  console.log(today)
  for (let i = 0; i < 60; i++) {
    var formattedUrl = new URL(baseUrl);
    today.setDate(today.getDate() + i);
    const checkinYear = today.getFullYear();
    const checkinMonth = ("0" + (today.getMonth() + 1)).slice(-2);
    const checkinDate = ("0" + today.getDate()).slice(-2);
    const formattedCheckinDate = checkinYear + '-' + checkinMonth + '-' + checkinDate;
    today.setDate(today.getDate() + 1);
    checkoutYear = today.getFullYear();
    checkoutMonth = ("0" + (today.getMonth() + 1)).slice(-2);
    checkoutDate = ("0" + today.getDate()).slice(-2);
    formattedCheckoutDate = checkoutYear + '-' + checkoutMonth + '-' + checkoutDate;
    formattedUrl.searchParams.set("checkinDate", formattedCheckinDate);
    formattedUrl.searchParams.set("checkoutDate", formattedCheckoutDate);
    formattedUrl.searchParams.set("hotelNo", hotelNumbers.join(','));
    formattedUrl.searchParams.set('applicationId', rakutenId);
    formattedUrl.searchParams.set('format', 'json');
    let res = ""
    await delay(1000);
    try {
      res = await axios.get(formattedUrl.href);
    } catch (e) {
      console.error(e + "  " + formattedCheckinDate + 'は空きがありませんでした' + formattedUrl.href)
      today = new Date();
      continue;
    }

    const content = res.data
    vacantHotels = content.hotels

    vacantHotels.forEach(function (hotel) {
      const hotelOutline = hotel["hotel"]
      const hotelBasic = (hotelOutline.find(hotel => hotel.hotelBasicInfo)).hotelBasicInfo
      const hotelName = hotelBasic.hotelName
      const hotelNumber = hotelBasic.hotelNo
      const displayName = hotelNames[hotelNumbers.indexOf(hotelNumber)]
      const roomPlans = hotelOutline.filter(hotel => hotel.roomInfo)
      roomPlans.forEach(room => {
        const rooms = room.roomInfo
        const roomBasic = (rooms.find(room => room.roomBasicInfo)).roomBasicInfo
        const roomClass = roomBasic.roomClass
        const roomName = roomBasic.roomName
        const plan = roomBasic.planName
        const planId = roomBasic.planId
        const daily = (rooms.find(room => room.dailyCharge)).dailyCharge
        const charge = daily.total
        query = planUrl + "?f_no=" + hotelNumber + "&f_flg=PLAN&f_heya_su=1&f_camp_id=" + planId + "&f_syu=" + roomClass + "&f_hizuke=" + checkinYear + checkinMonth + checkinDate + "&f_otona_su=1&f_thick=1&TB_iframe=true&height=768&width=1024"
        affiliateQuery =  planUrl + "?f_no=" + hotelNumber + "&f_flg=PLAN&f_heya_su=1&f_camp_id=" + planId + "&f_syu=" + roomClass + "&f_hizuke=" + checkinYear + checkinMonth + checkinDate + "&f_nen1=" + checkinYear + "&f_tuki1=" + checkinMonth + "&f_hi1=" + checkinDate + "&f_nen2=" + checkoutYear + "&f_tuki2=" + checkoutMonth + "&f_hi2=" + checkoutDate
        queryPc = "pc=" + encodeURIComponent(query) + '&'
        queryM = "m=" + encodeURIComponent(query)
        affiliateQueryPc = "pc=" + encodeURIComponent(affiliateQuery) + '&'
        affiliateQueryM = "m=" + encodeURIComponent(affiliateQuery)
        displayUrl = baseAffiliateUrl + '?' + queryPc + queryM
        affiliateUrl = baseAffiliateUrl + '?' + affiliateQueryPc + affiliateQueryM
        vacant = {}
        vacant.name = hotelName
        vacant.number = hotelNumber
        vacant.displayName = displayName
        vacant.date = formattedCheckinDate
        vacant.room = roomName
        vacant.charge = charge
        vacant.displayUrl = displayUrl
        vacant.affiliateUrl = affiliateUrl
        vacant.plan = plan
        console.log(today.getMonth() + 1 + '/' + today.getDate() + ' ' + today.getHours() + "時" + today.getMinutes() + "分" + formattedCheckinDate + vacant.name + ':' + vacant.room)
        vacants.push(vacant)
      })
    })
    today = new Date();
  }
  return vacants
};


exports.search = async (targetHotels) => {
  const hotelsInfo = targetHotels.map(n => n.hotels).flat()
  const hotelNames = hotelsInfo.map(n => n.name)
  const hotelNumbers = hotelsInfo.map(n => n.number)

  let latestVacants = "";
  let prevVacants = "";
  let k = 0;
  while (1 == 1) {
    k++;
    console.log(k + '回目です')
    prevVacants = latestVacants
    try {
      latestVacants = await getVacants(hotelNames, hotelNumbers);
    } catch (e) {
      displayText = 'latestを取得できませんでした'
      displayErrorToSlack(e.stack, displayText)
    }

    if (prevVacants.length) {
      const cancelDates = latestVacants.filter((latestVacant) => {
        const sameRoomDate = prevVacants.find((prevVacant) => (latestVacant.room == prevVacant.room) && (latestVacant.date == prevVacant.date))
        return sameRoomDate == undefined
      })
// https://hotel.travel.rakuten.co.jp/hotelinfo/plan/?f_syu=mut1&f_heya_su=1&f_no=74733&f_flg=PLAN&f_hizuke=20221031&f_camp_id=4530538&scid=af_pc_etc&sc2id=af_101_0_0
      console.log(latestVacants[0].name + 'らのlatestの部屋数です');
      console.log(latestVacants.length + '個')
      console.log('prevの部屋数です');
      console.log(prevVacants.length + '個')
      console.log('差分です')
      console.log('------------------')
      console.log(cancelDates.length + cancelDates)
      console.log('------------------')

      displayErrorToSlack("差分です", cancelDates.length + cancelDates)

      if (cancelDates.length >= 6) {
        continue;
      }
      for (cancelDate of cancelDates) {
        let browser
        try {
          let mainClient = '';
          let miraCostaClient = ''
          const cancelDateTypeOfDate = new Date(cancelDate.date)
          const cancelMonth = 1 + cancelDateTypeOfDate.getMonth();
          const cancelDay = cancelDateTypeOfDate.getDate();
          const dayOfWeek = cancelDateTypeOfDate.getDay();
          const cancelDayOfWeekStr = ["日", "月", "火", "水", "木", "金", "土"][dayOfWeek];
          displayErrorToSlack('ツイートするホテルだよ', cancelDate.name + cancelDate.number)
          const hashtagTexts = ["#ディズニーホテル", "#" + cancelDate.displayName]
          // const hashtagTexts = ["#" + cancelDate.displayName]
          let hashtagCounts = Math.floor(Math.random() * 4);
          let selectedHashtags = [];
          selectedHashtagTexts = selectedHashtags.join(' ')
          let hashtagText = '#ディズニーホテル '
          if (cancelDate.plan.match(/チケット付き/)) {
            hashtagText += '#チケット付き'
          }
          let replyParams = {}
          targetHotels.forEach(tweetHotel => {
            const twitterHotelNumbers = tweetHotel.hotels.map(hotel => hotel.number)
            // if (twitterHotelNumbers.includes(cancelDate.number)) {
            //   mainClient = new twitter(tweetHotel.client)
            //   if ((cancelDate.number == 183493) || (cancelDate.number == 74733)) {
            //     miraCostaClient = new twitter(tweetHotel.miraCostaClient)
            //     displayErrorToSlack('トイストーリーきたあ', miraCostaClient)
            //   }
            //   replyParams.status = cancelDate.affiliateUrl
            // }
          })
          console.log('clientだよ')
          console.log(mainClient)
          browser = await puppeteer.launch({
            // args: ['--no-sandbox']
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          const page = await browser.newPage();
          await page.setViewport({
            width: 1000,
            height: 585
          });
          console.log('これからpageにいくよ')
          await page.setDefaultNavigationTimeout(0);
          await page.goto(cancelDate.displayUrl);
          await delay(1000);
          console.log('gotoしたよ')
          const vacantNumStr = await page.evaluate((cancelDay) => {
            const vacants = Array.from(document.getElementsByClassName("vacant"))
            const vacantsSpecificDay = vacants.find(day => Number(day.previousElementSibling.innerText) == cancelDay)
            if (vacantsSpecificDay == undefined) {
              return
            }
            return vacantsSpecificDay.innerText
          }, cancelDay)
          if (vacantNumStr == undefined) {
            console.log('returnされたよ')
            displayErrorToSlack("vacantNumStrは空だったよ、キャンセルされた日", cancelDay + "  " + cancelDate.displayUrl)
            continue
          }
          displayErrorToSlack("vacantNumStrに値はあったよ、vacantNumStr", vacantNumStr + "  " + cancelDate.displayUrl)
          let vacantNumInt
          let starNum
          console.log('これからレアかどうか判断するよ')
          displayErrorToSlack("これからレアかどうか判定するよ", cancelDay)
          if (vacantNumStr == '○') {
            console.log('レアホテルではなかったのでスルーします, ◯')
            displayErrorToSlack("レアホテルではなかったのでスルーします, ◯", vacantNumStr)
            vacantNumInt = '○'
            continue
          } else if (Number(vacantNumStr.charAt(0)) >= 4) {
            console.log('レアホテルではなかったのでスルーします, 4室以上')
            displayErrorToSlack("レアホテルではなかったのでスルーします, 4室以上", vacantNumStr)
            vacantNumInt = '4か5'
            continue
          } else {
            console.log('レアホテル出ました')
            displayErrorToSlack("レアホテル出ました", vacantNumStr)
            vacantNumInt = Number(vacantNumStr.charAt(0))
          }
          if (vacantNumInt == 1){
            starNum = "★★★"
          } else if (vacantNumInt == 2) {
            starNum = "★★☆"
          } else if (vacantNumInt == 3){
            starNum = "★☆☆"
          }
          displayErrorToSlack("レアホテル出たからこれからツイートするよ", vacantNumInt)
          let nowSeconds = new Date()
          const screenshotPath = nowSeconds.getSeconds() + nowSeconds.getMilliseconds() + '.png'
          await delay(100);
          await page.screenshot({
            path: screenshotPath
          });
          const data = fs.readFileSync(screenshotPath);
          const lastMessages = ['に空きが出ましたね。', 'に空きが見つかりました。', 'に空室が見つかりました。']
          const lastMessage = lastMessages[Math.floor(Math.random() * lastMessages.length)]
          const baseText = cancelMonth + "/" + cancelDay + "(" + cancelDayOfWeekStr + ") " + "\n" +  cancelDate.displayName + "\n" + cancelDate.room + " (残り" + vacantNumInt + "室）" + "\n" + lastMessage + "\n"
          let displayHashtagTexts = hashtagTexts.join(' ')
          let text = baseText + displayHashtagTexts
          const media = await mainClient.post('media/upload', {
            media: data
          });
          let mainParams = {
            status: text
          }
          mainParams.media_ids = media.media_id_string
          // 一旦ツイートはコメントアウト ここは消さないで！！！
          // await tweetVacantHotel(mainClient, mainParams, replyParams)
          await sendLine(cancelDate);

          // if (miraCostaClient) {
          //   const subMedia = await miraCostaClient.post('media/upload', {
          //     media: data
          //   });
          //   let subParams = {
          //     status: text
          //   }
          //   subParams.media_ids = subMedia.media_id_string
          //   displayErrorToSlack("ミラコスタきたよ", miraCostaClient)
          //   await tweetVacantHotel(miraCostaClient, subParams, replyParams)
          // }
        } catch (e) {
          displayErrorToSlack(e.stack, cancelDate.displayUrl)
        } finally {
          if (browser != undefined) {
            await browser.close()
          }
        }
      }
    }

  }
}



// ---------------------------

const tweetVacantHotel = async (client, params, replyParams) => {
  const tweet = await client.post('statuses/update', params, async function (error, tweet, response) {
    displayErrorToSlack("tweetきたー", replyParams)
    if (!error) {
      replyParams.in_reply_to_status_id = tweet.id_str
      await delay(100);
      const reply = await client.post("statuses/update", replyParams, async function (error, tweet, response) {
        if (!error) {
          console.log("tweetreply success: ");
        } else {
          displayErrorToSlack('reply失敗' + error, replyParams)
          console.log("だめ: " + error);
        }
      });
      displayErrorToSlack("tweet成功replyParamsだよ", replyParams)
      console.log("tweet success: ");
    } else {
      displayErrorToSlack("tweetエラーreplyParamsだよ", replyParams)
      console.log(error);
    }
  });
}

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

const displayErrorToSlack = (e, text) => {
  let postData = ""

  if (text) {
    postData = JSON.stringify({
      "username": "node_bot",
      "text": e + '=>' + text
    });
  } else {
    postData = JSON.stringify({
      "username": "node_bot",
      "text": e
    });
  }

  let options = {
    hostname: 'hooks.slack.com',
    port: 443,
    path: '/services/T01HWM9VAV8/B02F0CY5D7F/w42LnX6SUYv8vCZEqgqEW764',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log("OK:" + res.statusCode);
    } else {
      console.log("Status Error:" + res.statusCode);
    }
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(postData);
  req.end();
}