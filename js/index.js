function getCurrentTheme() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 月份從 0 開始，所以要 +1
  const date = now.getDate();

  // 1. 2026/01/01 ~ 2026/03/03：新年模式
  if (year === 2026 && (month < 3 || (month === 3 && date <= 3))) {
    return "NEW_YEAR";
  }
  // 2. 2025/12/31 以前：聖誕模式
  if (year <= 2025) {
    return "CHRISTMAS";
  }
  // 3. 其他時間：日常四季風
  return "DAILY";
}

const cityMap = {
  高雄市: "kaohsiung",
  宜蘭縣: "yilan",
  花蓮縣: "hualien",
  臺東縣: "taitung",
  澎湖縣: "penghu",
  金門縣: "kinmen",
  連江縣: "lienchiang",
  臺北市: "taipei",
  新北市: "newtaipei",
  桃園市: "taoyuan",
  臺中市: "taichung",
  臺南市: "tainan",
  基隆市: "keelung",
  新竹縣: "hsinchu-county",
  新竹市: "hsinchu-city",
  苗栗縣: "miaoli",
  彰化縣: "changhua",
  南投縣: "nantou",
  雲林縣: "yunlin",
  嘉義縣: "chiayi-county",
  嘉義市: "chiayi-city",
  屏東縣: "pingtung",
};

const slugToName = Object.fromEntries(
  Object.entries(cityMap).map(([name, slug]) => [slug, name])
);

document.addEventListener("DOMContentLoaded", () => {
  const citySelect = document.getElementById("citySelect");

  // 1. 建立選項 (原本的 Code)
  Object.keys(cityMap).forEach((name) => {
    const option = document.createElement("option");
    option.value = cityMap[name];
    option.textContent = name;
    citySelect.appendChild(option);
  });

  // 2. 選單改變 (原本的 Code)
  citySelect.addEventListener("change", (e) => {
    fetchWeather(e.target.value);
  });

  // ⭐ 新增：在這裡執行主題樣式套用，確保 christmasTree 已經在網頁上了
  applyThemeStyles();

  // ⭐ 新增：在這裡啟動雪花/紅包生成
  setInterval(createSnowflake, 200);

  detectLocation();
});


function createSnowflake() {
  const theme = getCurrentTheme();
  // 先抓容器
  const container = document.getElementById("loading");
  
  // ⭐ 除錯防護：如果找不到容器就報錯，這樣你打開 F12 就知道問題在哪
  if (!container) {
    console.error("找不到 ID 為 loading 的容器！請檢查 HTML。");
    return;
  }

  const snowflake = document.createElement("div");
  snowflake.className = "snowflake"; 
  
  snowflake.style.left = Math.random() * 100 + "vw";
  snowflake.style.fontSize = Math.random() * 10 + 20 + "px"; 
  snowflake.style.animationDuration = Math.random() * 5 + 5 + "s";

  if (theme === "NEW_YEAR") {
    const icons = ["🧨", "✨", "🏮", "🧧", "💥"];
    snowflake.textContent = icons[Math.floor(Math.random() * icons.length)];
    snowflake.classList.add("sparkle-icon");
  } else if (theme === "CHRISTMAS") {
    snowflake.textContent = "❄️";
  } else {
    snowflake.textContent = "🍃";
  }

  container.appendChild(snowflake);

  setTimeout(() => snowflake.remove(), 6000);
}

async function fetchWeather(citySlug) {
  try {
    const url = `https://globalweather-tw.zeabur.app/api/weather/${citySlug}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      renderWeather(data.data);

      // document.getElementById("loading").style.display = "none";
      // document.getElementById("mainContent").style.display = "block";
    } else {
      throw new Error("API Error");
    }
  } catch (e) {
    console.error(e);
    alert("天氣資料讀取失敗，狸克把網路線咬斷了！");
  }
}

async function fetchWeatherKao() {
  try {
    const url = `https://globalweather-tw.zeabur.app/api/weather/kaohsiung`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      renderWeather(data.data);
      document.getElementById("citySelect").value = "kaohsiung";

      document.getElementById("loading").style.display = "none";
      document.getElementById("mainContent").style.display = "block";
    } else {
      throw new Error("API Error");
    }
  } catch (e) {
    console.error(e);
    alert("天氣資料讀取失敗，狸克把網路線咬斷了！");
  }
}

function detectLocation() {
  if (!navigator.geolocation) {
    fetchWeather("kaohsiung");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const geoData = await geoRes.json();

        let county =
          geoData.address.county ||
          geoData.address.city ||
          geoData.address.town ||
          "";

        const fallbackMap = {
          Taipei: "臺北市",
          "New Taipei": "新北市",
          Taoyuan: "桃園市",
          Taichung: "臺中市",
          Tainan: "臺南市",
          Kaohsiung: "高雄市",
        };

        if (!cityMap[county]) {
          county = fallbackMap[county] || "高雄市";
        }

        const citySlug = cityMap[county] || "kaohsiung";
        document.getElementById("citySelect").value = citySlug;
        fetchWeather(citySlug);
      } catch {
        fetchWeather("kaohsiung");
      }
    },
    () => {
      // ⭐ 這是手機最常走到的地方
      alert("未開啟定位，已顯示預設城市（高雄）\n可手動選擇其他城市");
      fetchWeatherKao();
    }
  );
}

function getWeatherIcon(weather) {
  if (!weather) return "🌤️";
  if (weather.includes("晴")) return "☀️";
  if (weather.includes("多雲")) return "⛅";
  if (weather.includes("陰")) return "☁️";
  if (weather.includes("雨")) return "🌧️";
  if (weather.includes("雷")) return "⛈️";
  return "🌤️";
}

function getAdvice(rainProb, maxTemp) {
  let rainIcon = "🌂",
    rainText = "不用帶傘";
  if (parseInt(rainProb) > 30) {
    rainIcon = "☂️";
    rainText = "記得帶傘！";
  }

  let clothIcon = "👕",
    clothText = "舒適穿搭";
  if (parseInt(maxTemp) >= 28) {
    clothIcon = "🎽";
    clothText = "短袖出發";
  } else if (parseInt(maxTemp) <= 20) {
    clothIcon = "🧥";
    clothText = "加件外套";
  }

  return { rainIcon, rainText, clothIcon, clothText };
}
// 傳入三個參數：天氣描述、溫度、降雨機率
function getFoodAdvice(weather, temp, rainProb) {
  const t = parseInt(temp);
  const r = parseInt(rainProb);
  const hasRainDesc = weather.includes("雨") || weather.includes("雷");

  // 1. 先處理「冷」的優先級 (冷的時候，不管有沒有雨，火鍋最重要)
  if (t <= 20) {
    return {
      icon: "🍲",
      text: `外面只有 ${t} 度！這種天氣不吃火鍋或拉麵真的對不起自己。`,
    };
  }

  // 2. 處理「雨」的邏輯 (只有當降雨率夠高，才建議躲在家)
  if (hasRainDesc && r >= 40) {
    return {
      icon: "🍗",
      text: `降雨率 ${r}%，外面濕答答，點份炸雞配電影最爽！`,
    };
  }

  // 3. 處理「熱」的邏輯
  if (t >= 28) {
    return { icon: "🍦", text: "氣溫有點高耶，要不要來支聖誕限定冰淇淋？" };
  }

  // 4. 預設（舒服的天氣）
  const festiveFood = ["烤雞", "聖誕熱紅酒", "義大利麵", "暖心拿鐵"];
  const randomFood =
    festiveFood[Math.floor(Math.random() * festiveFood.length)];
  return { icon: "🎁", text: `氣候宜人，今天適合犒賞自己吃個${randomFood}！` };
}
function getTimePeriod(startTime) {
  const hour = new Date(startTime).getHours();
  if (hour >= 5 && hour < 11) return "早晨";
  if (hour >= 11 && hour < 14) return "中午";
  if (hour >= 14 && hour < 18) return "下午";
  if (hour >= 18 && hour < 23) return "晚上";
  return "深夜";
}
// 背景切換
function updateBackground(weather, hour) {
  const body = document.body;
  body.className = ""; // 先清掉原本 class

  let isNight = hour < 6 || hour >= 18;

  if (isNight) {
    body.classList.add("night");
    generateStars();
  } else {
    removeStars();
    if (weather.includes("晴")) body.classList.add("sunny");
    else if (weather.includes("雲")) body.classList.add("cloudy");
    else if (weather.includes("雨") || weather.includes("雷"))
      body.classList.add("rainy");
    else body.classList.add("sunny"); // 預設
  }
}

// 產生星星
let starElements = [];
function generateStars(count = 50) {
  removeStars();
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.top = Math.random() * 100 + "%";
    star.style.left = Math.random() * 100 + "%";
    star.style.width = Math.random() * 2 + 1 + "px";
    star.style.height = star.style.width;
    star.style.animationDuration = Math.random() * 3 + 1 + "s";
    document.body.appendChild(star);
    starElements.push(star);
  }
}

function removeStars() {
  starElements.forEach((s) => s.remove());
  starElements = [];
}
function setLoadingBackground(weather, hour) {
  const loading = document.getElementById("loading");
  let isNight = hour < 6 || hour >= 18;

  if (isNight) {
    loading.style.background = "linear-gradient(to bottom, #001f3f, #000)";
  } else {
    if (weather.includes("晴"))
      loading.style.background = "linear-gradient(to bottom, #87CEFA, #7DE1A9)";
    else if (weather.includes("雲"))
      loading.style.background = "linear-gradient(to bottom, #B0C4DE, #E0E5EC)";
    else if (weather.includes("雨") || weather.includes("雷"))
      loading.style.background = "linear-gradient(to bottom, #4B79A1, #283E51)";
    else
      loading.style.background = "linear-gradient(to bottom, #87CEFA, #7DE1A9)"; // 預設
  }
}

function applyThemeStyles() {
  const theme = getCurrentTheme();
  const root = document.documentElement;
  const treeEl = document.getElementById("christmasTree");
  const newYearEl = document.getElementById("newYear");

  if (theme === "NEW_YEAR") {
    // 新年模式：紅金配色
    root.style.setProperty('--ac-green', '#cd5f5fff'); 
    root.style.setProperty('--ac-bg-pattern', '#8b0000');
    if (newYearEl) newYearEl.style.display = "block";
    if (treeEl) treeEl.style.display = "none";
    
  } else if (theme === "CHRISTMAS") {
    // 聖誕模式：森林綠
    root.style.setProperty('--ac-green', '#2d5a27');
    if (treeEl) {
      treeEl.style.display = "block";
      treeEl.textContent = "🎄";
    }
    if (newYearEl) newYearEl.style.display = "none";

  } else {
    // ⭐ DAILY (日常模式)：顯示綠色系與大樹
    root.style.setProperty('--ac-green', '#7de1a9');
    root.style.setProperty('--ac-bg-pattern', '#8fd8af');
    
    if (treeEl) {
      treeEl.style.display = "block";
      treeEl.textContent = "🌳"; // 日常模式顯示一般大樹
    }
    if (newYearEl) newYearEl.style.display = "none";
  }
}

function renderWeather(data) {
  const forecasts = data.forecasts;
  const current = forecasts[0];
const theme = getCurrentTheme();
const title = theme === "NEW_YEAR" ? "新春開運美食：" : 
              theme === "CHRISTMAS" ? "聖誕美食建議：" : "今日美食推薦：";
  const hour = new Date(current.startTime).getHours();
  updateBackground(current.weather, hour);

  // ★ 新增：設定 loading 背景與主畫面一致
  setLoadingBackground(current.weather, hour);

  const others = forecasts.slice(1);
  const advice = getAdvice(current.rain, current.maxTemp);
  const food = getFoodAdvice(current.weather, current.maxTemp, current.rain);
  const period = getTimePeriod(current.startTime);
  const avgTemp = Math.round(
    (parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2
  );

  document.getElementById("heroCard").innerHTML = `
        <div class="hero-card">
            <div class="hero-period">${period}</div>
            <div class="hero-temp-container">
                <div class="hero-icon">${getWeatherIcon(current.weather)}</div>
                <div class="hero-temp">${avgTemp}°</div>
            </div>
            <div class="hero-desc">${current.weather}</div>
            <div class="advice-grid">
                <div class="advice-item">
                    <div class="advice-icon">${advice.rainIcon}</div>
                    <div class="advice-text">${advice.rainText}</div>
                    <div style="font-size:0.7rem; color:#999">降雨率 ${
                      current.rain
                    }</div>
                </div>
                <div class="advice-item">
                    <div class="advice-icon">${advice.clothIcon}</div>
                    <div class="advice-text">${advice.clothText}</div>
                    <div style="font-size:0.7rem; color:#999">最高溫 ${
                      current.maxTemp
                    }°</div>
                </div>
            </div>
            <div class="food-advice-box">
                <div class="food-icon">${food.icon}</div>
                <div class="food-text">
                    <span style="font-size:0.8rem; color:#b08d57; font-weight:bold;">${title}：</span><br>
                    ${food.text}
                </div>
            </div>
        </div>
    `;

  // 顯示主畫面
  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
  }, 4000); // 4 秒

  const scrollContainer = document.getElementById("futureForecasts");
  scrollContainer.innerHTML = "";

  const todayDate = new Date().getDate();

  others.forEach((f) => {
    let p = getTimePeriod(f.startTime);
    const fDate = new Date(f.startTime);
    if (fDate.getDate() !== todayDate) {
      p = "明天" + p;
    }

    scrollContainer.innerHTML += `
                    <div class="mini-card">
                        <div class="mini-time">${p}</div>
                        <div class="mini-icon">${getWeatherIcon(
                          f.weather
                        )}</div>
                        <div class="mini-temp">${f.minTemp}° - ${
      f.maxTemp
    }°</div>
                        <div style="font-size:0.8rem; color:#888; margin-top:5px;">💧${
                          f.rain
                        }</div>
                    </div>
                `;
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayIndex = now.getDay();
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  document.getElementById(
    "updateTime"
  ).textContent = `${month}月${date}日 ${days[dayIndex]}`;
}
