
$(function () {

    // 検索ボタンをクリック
    $("#search").on("click", function () {

        const city = $("#city").val().trim();

        if (city === "") {
            $("#message").text("都市名を入力してください。");
            return;
        }

        getWeather(city);
    });

    // Enterキーでも検索
    $("#city").on("keydown", function (event) {

        if (event.key === "Enter") {
            $("#search").click();
        }

    });

});


// 天気情報を取得
async function getWeather(city) {

    $("#message").text("天気を検索しています...");
    $("#search").prop("disabled", true);

    const controller = new AbortController();

    const timeout = setTimeout(function () {
        controller.abort();
    }, 30000);

    try {

        // ① 都市情報を取得
        const geoUrl =
            "https://geocoding-api.open-meteo.com/v1/search?name="
            + encodeURIComponent(city)
            + "&count=1&language=ja&format=json";

        const geoResponse = await fetch(geoUrl, {
            signal: controller.signal
        });

        if (!geoResponse.ok) {
            throw new Error("都市情報を取得できませんでした。");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("都市が見つかりませんでした。");
        }

        const location = geoData.results[0];

        // ② 天気情報を取得
        const weatherUrl =
            "https://api.open-meteo.com/v1/forecast?"
            + "latitude=" + location.latitude
            + "&longitude=" + location.longitude
            + "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
            + "&timezone=auto";

        const weatherResponse = await fetch(weatherUrl, {
            signal: controller.signal
        });

        if (!weatherResponse.ok) {
            throw new Error("天気情報を取得できませんでした。");
        }

        const weatherData = await weatherResponse.json();

        const current = weatherData.current;

        // ③ 天気を判定
        let description = "不明";
        let icon = "🌤️";

        const code = current.weather_code;

        if (code === 0) {
            description = "快晴";
            icon = "☀️";
        } else if (code <= 3) {
            description = "晴れ・くもり";
            icon = "⛅";
        } else if (code <= 48) {
            description = "霧";
            icon = "🌫️";
        } else if (code <= 67 || (code >= 80 && code <= 82)) {
            description = "雨";
            icon = "🌧️";
        } else if (code <= 77) {
            description = "雪";
            icon = "❄️";
        } else if (code >= 95) {
            description = "雷雨";
            icon = "⛈️";
        }

        // ④ jQueryで画面に表示
        $("#cityName").text(location.name);

        $("#icon").text(icon);

        $("#temperature").text(
            current.temperature_2m + "℃"
        );

        $("#description").text(description);

        $("#humidity").text(
            current.relative_humidity_2m + "%"
        );

        $("#wind").text(
            current.wind_speed_10m + " m/s"
        );

        $("#message").text("");

    } catch (error) {

        console.error("天気取得エラー:", error);

        if (error.name === "AbortError") {
            $("#message").text("通信がタイムアウトしました。");
        } else {
            $("#message").text(error.message);
        }

    } finally {

        clearTimeout(timeout);

        $("#search").prop("disabled", false);

    }

}
