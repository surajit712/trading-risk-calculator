// =====================================
// TRADING JOURNAL V4
// =====================================


// =====================================
// STORAGE
// =====================================

function getTrades() {
    try {
        return JSON.parse(localStorage.getItem("trades")) || [];
    } catch (error) {
        return [];
    }
}


function saveTrades(trades) {
    localStorage.setItem("trades", JSON.stringify(trades));
}


function getAccount() {
    try {
        return JSON.parse(localStorage.getItem("account")) || {
            startingBalance: 0
        };
    } catch (error) {
        return {
            startingBalance: 0
        };
    }
}


// =========================================
// ACCOUNT SYSTEM - V4.1
// =========================================

function getTrades() {
    return JSON.parse(localStorage.getItem("trades")) || [];
}

function getAccount() {
    return JSON.parse(localStorage.getItem("account")) || {
        startingBalance: 0
    };
}


// =========================================
// SAVE ACCOUNT SETTINGS
// =========================================

function saveAccountSettings() {

    const input = document.getElementById("startingBalance");

    if (!input) return;

    const startingBalance = parseFloat(input.value);

    if (isNaN(startingBalance) || startingBalance <= 0) {
        alert("Please enter a valid starting balance.");
        return;
    }

    localStorage.setItem(
        "account",
        JSON.stringify({
            startingBalance: startingBalance
        })
    );

    updateAccount();

    // Also update calculator balance
    const balanceInput = document.getElementById("balance");

    if (balanceInput) {
        balanceInput.value = startingBalance;
    }

    alert("Account settings saved successfully!");
}


// =========================================
// RESET ACCOUNT
// =========================================

function resetAccountSettings() {

    const confirmReset = confirm(
        "Reset account balance? Your trade history will NOT be deleted."
    );

    if (!confirmReset) return;

    localStorage.removeItem("account");

    const input = document.getElementById("startingBalance");

    if (input) {
        input.value = "";
    }

    updateAccount();

    const balanceInput = document.getElementById("balance");

    if (balanceInput) {
        balanceInput.value = "";
    }
}


// Backward compatibility
function resetAccount() {
    resetAccountSettings();
}


// =========================================
// CALCULATE TOTAL P/L
// =========================================

function calculateTotalPL() {

    const trades = getTrades();

    let totalPL = 0;

    trades.forEach(trade => {

        if (trade.result === "WIN") {

            totalPL += Number(trade.profit) || 0;

        } else if (trade.result === "LOSS") {

            totalPL -= Number(trade.risk) || 0;

        }

    });

    return totalPL;
}


// =========================================
// CALCULATE MAX DRAWDOWN
// =========================================

function calculateMaxDrawdown() {

    const trades = getTrades();

    let runningPL = 0;
    let peak = 0;
    let maxDrawdown = 0;

    trades.forEach(trade => {

        if (trade.result === "WIN") {
            runningPL += Number(trade.profit) || 0;
        }

        if (trade.result === "LOSS") {
            runningPL -= Number(trade.risk) || 0;
        }

        if (runningPL > peak) {
            peak = runningPL;
        }

        const drawdown = peak - runningPL;

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }

    });

    return maxDrawdown;
}


// =========================================
// UPDATE ACCOUNT DISPLAY
// =========================================

function updateAccount() {

    const account = getAccount();

    const startingBalance = Number(account.startingBalance) || 0;

    const totalPL = calculateTotalPL();
    setMoney(
    "summaryTotalPL",
    totalPL
);


    const currentBalance = startingBalance + totalPL;

    const maxDrawdown = calculateMaxDrawdown();


    // Starting Balance
    const startingDisplay =
        document.getElementById("startingBalanceDisplay");

    if (startingDisplay) {
        startingDisplay.textContent =
            "$" + startingBalance.toFixed(2);
    }


    // Current Balance
    const currentDisplay =
        document.getElementById("currentBalanceDisplay");

    if (currentDisplay) {
        currentDisplay.textContent =
            "$" + currentBalance.toFixed(2);
    }


    // Net P/L
    const netPLDisplay =
        document.getElementById("netPLDisplay");

    if (netPLDisplay) {

        const sign = totalPL > 0 ? "+" : "";

        netPLDisplay.textContent =
            sign + "$" + totalPL.toFixed(2);
    }


    // Max Drawdown
    const drawdownDisplay =
        document.getElementById("accountDrawdownDisplay");

    if (drawdownDisplay) {
        drawdownDisplay.textContent =
            "$" + maxDrawdown.toFixed(2);
    }


    // Update calculator balance
    const balanceInput =
        document.getElementById("balance");

    if (balanceInput && startingBalance > 0) {
        balanceInput.value = startingBalance;
    }
}


// =====================================
// RISK CALCULATOR
// =====================================

function calculateRisk() {

    const balance =
        Number(
            document.getElementById("balance").value
        );

    const riskPercent =
        Number(
            document.getElementById("risk").value
        );

    const direction =
        document.getElementById("direction").value;

    const instrument =
        document.getElementById("instrument").value;

    const entry =
        Number(
            document.getElementById("entry").value
        );

    const stopLoss =
        Number(
            document.getElementById("stopLoss").value
        );

    const takeProfit =
        Number(
            document.getElementById("takeProfit").value
        );


    if (
        balance <= 0 ||
        riskPercent <= 0 ||
        entry <= 0 ||
        stopLoss <= 0 ||
        takeProfit <= 0
    ) {
        alert("Please enter valid values.");
        return;
    }


    // BUY validation
    if (direction === "BUY") {

        if (stopLoss >= entry) {
            alert(
                "For BUY: Stop Loss must be below Entry Price."
            );
            return;
        }

        if (takeProfit <= entry) {
            alert(
                "For BUY: Take Profit must be above Entry Price."
            );
            return;
        }
    }


    // SELL validation
    if (direction === "SELL") {

        if (stopLoss <= entry) {
            alert(
                "For SELL: Stop Loss must be above Entry Price."
            );
            return;
        }

        if (takeProfit >= entry) {
            alert(
                "For SELL: Take Profit must be below Entry Price."
            );
            return;
        }
    }


    const riskAmount =
        balance * (riskPercent / 100);

    const stopDistance =
        Math.abs(entry - stopLoss);

    const profitDistance =
        Math.abs(takeProfit - entry);


    if (stopDistance <= 0) {
        alert("Entry and Stop Loss cannot be the same.");
        return;
    }


    let lotSize = 0;
    let positionSize = 0;
    let potentialProfit = 0;


    // =====================================
    // FOREX
    // =====================================

    if (instrument === "Forex") {

        const pair =
            document.getElementById("forexPair").value;

        const pipSize =
            pair === "USDJPY"
                ? 0.01
                : 0.0001;

        const pipDistance =
            stopDistance / pipSize;

        const pipValuePerLot = 10;


        lotSize =
            riskAmount /
            (pipDistance * pipValuePerLot);


        positionSize =
            lotSize * 100000;


        potentialProfit =
            lotSize *
            (profitDistance / pipSize) *
            pipValuePerLot;
    }


    // =====================================
    // GOLD
    // =====================================

    else {

        const contractSize = 100;


        lotSize =
            riskAmount /
            (stopDistance * contractSize);


        positionSize =
            lotSize * contractSize;


        potentialProfit =
            lotSize *
            profitDistance *
            contractSize;
    }


    const riskReward =
        profitDistance / stopDistance;


    // =====================================
    // DISPLAY RESULTS
    // =====================================

    document.getElementById("riskAmount").textContent =
        "$" +
        riskAmount.toFixed(2);


    document.getElementById("positionSize").textContent =
        positionSize.toFixed(2);


    document.getElementById("calculatedLot").textContent =
        lotSize.toFixed(2);


    document.getElementById("profit").textContent =
        "$" +
        potentialProfit.toFixed(2);


    document.getElementById("riskReward").textContent =
        "1 : " +
        riskReward.toFixed(2);


    // =====================================
    // R:R WARNING
    // =====================================

    const warning =
        document.getElementById("riskWarning");


    if (riskReward >= 2) {

        warning.textContent =
            "🟢 Good R:R — Risk/Reward looks favorable.";

    } else if (riskReward >= 1) {

        warning.textContent =
            "🟡 Moderate R:R — Consider waiting for a better setup.";

    } else {

        warning.textContent =
            "🔴 Poor R:R — Potential reward is lower than risk.";
    }


    // =====================================
    // RISK LEVEL
    // =====================================

    const riskLevel =
        document.getElementById("riskLevel");


    if (riskPercent <= 1) {

        riskLevel.textContent =
            "🟢 Low Risk — 1% or less.";

    } else if (riskPercent <= 2) {

        riskLevel.textContent =
            "🟡 Moderate Risk — Keep your risk controlled.";

    } else {

        riskLevel.textContent =
            "🔴 High Risk — Consider reducing your risk.";
    }


    updateSummaryRR(riskReward);
}


// =====================================
// SUMMARY R:R
// =====================================

function updateSummaryRR(rr) {

    const element =
        document.getElementById("summaryRR");

    if (element) {

        element.textContent =
            "1 : " +
            Number(rr).toFixed(2);
    }
}


// =====================================
// RESET CALCULATOR
// =====================================

function resetCalculator() {

    const account = getAccount();

    const balance =
        Number(account.startingBalance) || 5000;


    document.getElementById("balance").value =
        balance.toFixed(2);

    document.getElementById("risk").value = "1";

    document.getElementById("direction").value =
        "BUY";

    document.getElementById("instrument").value =
        "Forex";

    document.getElementById("forexPair").value =
        "EURUSD";

    document.getElementById("entry").value = "100";

    document.getElementById("stopLoss").value = "98";

    document.getElementById("takeProfit").value = "106";


    document.getElementById("riskAmount").textContent =
        "$0";

    document.getElementById("positionSize").textContent =
        "0";

    document.getElementById("calculatedLot").textContent =
        "0.00";

    document.getElementById("profit").textContent =
        "$0";

    document.getElementById("riskReward").textContent =
        "0";

    document.getElementById("summaryRR").textContent =
        "0";

    document.getElementById("riskWarning").textContent =
        "";

    document.getElementById("riskLevel").textContent =
        "";

    updateInstrumentFields();
}


// =====================================
// SAVE TRADE
// =====================================

function saveTrade() {

    const balance =
        Number(
            document.getElementById("balance").value
        );

    const riskPercent =
        Number(
            document.getElementById("risk").value
        );

    const direction =
        document.getElementById("direction").value;

    const instrument =
        document.getElementById("instrument").value;

    const entry =
        Number(
            document.getElementById("entry").value
        );

    const stopLoss =
        Number(
            document.getElementById("stopLoss").value
        );

    const takeProfit =
        Number(
            document.getElementById("takeProfit").value
        );


    if (
        balance <= 0 ||
        riskPercent <= 0 ||
        entry <= 0 ||
        stopLoss <= 0 ||
        takeProfit <= 0
    ) {
        alert("Calculate a valid trade first.");
        return;
    }


    // Make sure calculation is valid
    if (direction === "BUY") {

        if (
            stopLoss >= entry ||
            takeProfit <= entry
        ) {
            alert("Please enter a valid BUY setup.");
            return;
        }
    }


    if (direction === "SELL") {

        if (
            stopLoss <= entry ||
            takeProfit >= entry
        ) {
            alert("Please enter a valid SELL setup.");
            return;
        }
    }


    const riskAmount =
        balance *
        (riskPercent / 100);


    const stopDistance =
        Math.abs(entry - stopLoss);

    const profitDistance =
        Math.abs(takeProfit - entry);


    let lotSize = 0;
    let positionSize = 0;
    let potentialProfit = 0;


    if (instrument === "Forex") {

        const pair =
            document.getElementById("forexPair").value;

        const pipSize =
            pair === "USDJPY"
                ? 0.01
                : 0.0001;

        const pipDistance =
            stopDistance / pipSize;

        const pipValuePerLot = 10;


        lotSize =
            riskAmount /
            (pipDistance * pipValuePerLot);


        positionSize =
            lotSize * 100000;


        potentialProfit =
            lotSize *
            (profitDistance / pipSize) *
            pipValuePerLot;

    } else {

        const contractSize = 100;


        lotSize =
            riskAmount /
            (stopDistance * contractSize);


        positionSize =
            lotSize * contractSize;


        potentialProfit =
            lotSize *
            profitDistance *
            contractSize;
    }


    const riskReward =
        profitDistance / stopDistance;


    const pair =
        instrument === "Forex"
            ? document.getElementById("forexPair").value
            : "XAUUSD";


    const trade = {

        id:
            Date.now(),

        date:
            new Date().toISOString(),

        direction:
            direction,

        instrument:
            instrument,

        pair:
            pair,

        balance:
            balance,

        riskPercent:
            riskPercent,

        entry:
            entry,

        stopLoss:
            stopLoss,

        takeProfit:
            takeProfit,

        lotSize:
            lotSize.toFixed(2),

        risk:
            riskAmount.toFixed(2),

        profit:
            potentialProfit.toFixed(2),

        rr:
            riskReward.toFixed(2),

        result:
            null
    };


    const trades =
        getTrades();

    trades.push(trade);

    saveTrades(trades);


    displayTrades();

    updateStats();

    updateAccount();

    drawEquityCurve();

    drawWinLossChart();


    alert("Trade saved successfully!");
}


// =====================================
// TRADE HISTORY
// =====================================
function displayTrades(tradeList = null) {

    const history = document.getElementById("historyList");

    if (!history) return;

    const allTrades = getTrades();

    const trades = tradeList || allTrades;

    if (trades.length === 0) {
        history.innerHTML = "<p>No trades saved yet.</p>";
        return;
    }

    history.innerHTML = "";

    trades.forEach((trade) => {

        const originalIndex = allTrades.indexOf(trade);

        const box = document.createElement("div");

        box.className = "trade-box";

        const resultText = trade.result || "Not Set";

        const resultClass =
            trade.result === "WIN"
                ? "win"
                : trade.result === "LOSS"
                    ? "loss"
                    : "";

        const dateText =
            trade.date
                ? new Date(trade.date).toLocaleString()
                : "";

        box.innerHTML = `

            <strong>Trade ${originalIndex + 1}</strong>

            <p>Date: ${dateText}</p>

            <p>Direction: ${trade.direction || "-"}</p>

            <p>Instrument: ${trade.instrument || "-"}</p>

            <p>Pair: ${trade.pair || "-"}</p>

            <p>Entry: ${trade.entry || "-"}</p>

            <p>Stop Loss: ${trade.stopLoss || "-"}</p>

            <p>Take Profit: ${trade.takeProfit || "-"}</p>

            <p>Lot Size: ${trade.lotSize || "-"}</p>

            <p>Risk: $${Number(trade.risk || 0).toFixed(2)}</p>

            <p>
                Potential Profit:
                $${Number(trade.profit || 0).toFixed(2)}
            </p>

            <p>
                R:R: 1 : ${trade.rr || "0"}
            </p>

            <p>
                Result:
                <strong class="${resultClass}">
                    ${resultText}
                </strong>
            </p>

            <div class="trade-actions">

                <button
                    onclick="setTradeResult(${originalIndex}, 'WIN')">
                    WIN
                </button>

                <button
                    onclick="setTradeResult(${originalIndex}, 'LOSS')">
                    LOSS
                </button>

            </div>

            <button
                onclick="deleteTrade(${originalIndex})"
                class="delete-button">
                Delete
            </button>
        `;

        history.appendChild(box);
    });
}


// =====================================
// WIN / LOSS
// =====================================
function setTradeResult(index, result) {

    const trades = getTrades();

    if (!trades[index]) {
        return;
    }

    // Already completed trade হলে আর পরিবর্তন করবে না
    if (trades[index].result === "WIN" || trades[index].result === "LOSS") {
        alert("This trade is already completed.");
        return;
    }

    trades[index].result = result;
    trades[index].completedAt = new Date().toISOString();


    localStorage.setItem("trades", JSON.stringify(trades));

    // সবকিছু update
    displayTrades();
    updateStats();
    updateAccount();
    drawEquityCurve();

    alert("Trade marked as " + result);
}
// =====================================
// CLEAR ALL TRADES
// =====================================

function clearAllTrades() {

    if (
        !confirm(
            "Are you sure you want to delete all trades?"
        )
    ) {
        return;
    }


    localStorage.removeItem("trades");


    displayTrades();

    updateStats();

    updateAccount();

    drawEquityCurve();

    drawWinLossChart();
}


// =====================================
// FILTER TRADES
// =====================================

function filterTrades() {

    const date =
        document.getElementById("filterDate").value;


    if (!date) {

        displayTrades();

        return;
    }


    const trades =
        getTrades();


    const filtered =
        trades.filter(trade => {

            if (!trade.date) return false;

            return (
                new Date(trade.date)
                    .toISOString()
                    .slice(0, 10)
                === date
            );
        });


    displayTrades(filtered);
}


// =====================================
// CLEAR FILTER
// =====================================

function clearTradeFilter() {

    const input =
        document.getElementById("filterDate");


    if (input) {
        input.value = "";
    }


    displayTrades();
}


// =====================================
// STATISTICS
// =====================================

// Get Profit / Loss for one completed trade
function getTradePL(trade) {

    if (!trade) {
        return 0;
    }

    if (trade.result === "WIN") {
        return Number(trade.profit) || 0;
    }

    if (trade.result === "LOSS") {
        return -(Number(trade.risk) || 0);
    }

    return 0;
}
function updateStats() {

    const trades =
        getTrades();


    const completed =
        trades.filter(
            trade =>
                trade.result === "WIN" ||
                trade.result === "LOSS"
        );


    const wins =
        completed.filter(
            trade => trade.result === "WIN"
        );


    const losses =
        completed.filter(
            trade => trade.result === "LOSS"
        );


    const totalTrades =
        completed.length;

    const winCount =
        wins.length;

    const lossCount =
        losses.length;


    const winRate =
        totalTrades > 0
            ? (winCount / totalTrades) * 100
            : 0;


    let totalProfit = 0;

    let totalLoss = 0;


    wins.forEach(trade => {

        totalProfit +=
            Number(trade.profit) || 0;
    });


    losses.forEach(trade => {

        totalLoss +=
            Number(trade.risk) || 0;
    });


    const totalPL =
        totalProfit - totalLoss;


    const averageWin =
        winCount > 0
            ? totalProfit / winCount
            : 0;


    const averageLoss =
        lossCount > 0
            ? totalLoss / lossCount
            : 0;


    const profitFactor =
        totalLoss > 0
            ? totalProfit / totalLoss
            : totalProfit > 0
                ? Infinity
                : 0;


    let bestTrade = 0;

    let worstTrade = 0;


    completed.forEach(trade => {

        const value =
            getTradePL(trade);


        if (value > bestTrade) {
            bestTrade = value;
        }


        if (value < worstTrade) {
            worstTrade = value;
        }
    });


    // =====================================
    // CONSECUTIVE LOSSES
    // =====================================

    let currentLossStreak = 0;

    let maxLossStreak = 0;


    let currentWinStreak = 0;

    let maxWinStreak = 0;


    completed.forEach(trade => {

        if (trade.result === "LOSS") {

            currentLossStreak++;

            currentWinStreak = 0;

            if (
                currentLossStreak >
                maxLossStreak
            ) {
                maxLossStreak =
                    currentLossStreak;
            }

        } else {

            currentWinStreak++;

            currentLossStreak = 0;

            if (
                currentWinStreak >
                maxWinStreak
            ) {
                maxWinStreak =
                    currentWinStreak;
            }
        }
    });


    // =====================================
    // EXPECTANCY
    // =====================================

    const expectancy =
        totalTrades > 0
            ? totalPL / totalTrades
            : 0;


    // =====================================
    // AVERAGE RISK %
    // =====================================

    let totalRiskPercent = 0;

    let riskCount = 0;


    trades.forEach(trade => {

        if (
            trade.riskPercent !== undefined &&
            Number.isFinite(
                Number(trade.riskPercent)
            )
        ) {

            totalRiskPercent +=
                Number(trade.riskPercent);

            riskCount++;
        }
    });


    const averageRisk =
        riskCount > 0
            ? totalRiskPercent / riskCount
            : 0;


    // =====================================
    // UPDATE HTML
    // =====================================

    setText(
        "totalTrades",
        totalTrades
    );


    setText(
        "totalWins",
        winCount
    );

    setText(
        "totalLosses",
        lossCount
    );

    setText(
    "winRate",
    winRate.toFixed(1) + "%"
);

setText(
    "summaryWinRate",
    winRate.toFixed(1) + "%"
);

setText(
    "summaryTotalTrades",
    totalTrades
);

setMoney(
    "totalPL",
    totalPL
);

setMoney(
    "summaryTotalPL",
    totalPL
);
    setMoney(
        "averageWin",
        averageWin
    );

    setMoney(
        "averageLoss",
        averageLoss
    );


    setText(
        "profitFactor",
        profitFactor === Infinity
            ? "∞"
            : profitFactor.toFixed(2)
    );


    setMoney(
        "bestTrade",
        bestTrade
    );

    setMoney(
        "worstTrade",
        worstTrade
    );


    setMoney(
        "maxDrawdown",
        calculateMaxDrawdown()
    );


    setText(
        "maxConsecutiveLosses",
        maxLossStreak
    );


    setText(
        "winningStreak",
        maxWinStreak
    );


    setText(
        "losingStreak",
        maxLossStreak
    );


    setText(
        "averageRiskPercent",
        averageRisk.toFixed(2) + "%"
    );


    setMoney(
        "expectancy",
        expectancy
    );


    updatePerformanceDashboard();

    updateAccount();
    console.log("V4 UPDATE STATS RUNNING", totalTrades, winRate);
}


// =====================================
// HELPER: TEXT
// =====================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// =====================================
// HELPER: MONEY
// =====================================

function setMoney(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;


    const number =
        Number(value) || 0;


    element.textContent =
        (number >= 0 ? "+" : "") +
        "$" +
        number.toFixed(2);
}


// =====================================
// PERFORMANCE DASHBOARD
// =====================================

function updatePerformanceDashboard() {

    const trades =
        getTrades();


    const today =
        new Date();


    const todayString =
        today.toISOString().slice(0, 10);


    const month =
        today.toISOString().slice(0, 7);


    let todayPL = 0;

    let monthPL = 0;


    trades.forEach(trade => {

        if (
            trade.result !== "WIN" &&
            trade.result !== "LOSS"
        ) {
            return;
        }


        const tradeDate =
            trade.date
                ? new Date(trade.date)
                : null;


        if (!tradeDate) return;


        const dateString =
            tradeDate
                .toISOString()
                .slice(0, 10);


        const monthString =
            tradeDate
                .toISOString()
                .slice(0, 7);


        const pl =
            getTradePL(trade);


        if (dateString === todayString) {
            todayPL += pl;
        }


        if (monthString === month) {
            monthPL += pl;
        }
    });


    setMoney(
        "todayPL",
        todayPL
    );


    setMoney(
        "monthPL",
        monthPL
    );
}


// =====================================
// WIN / LOSS CHART
// =====================================

function drawWinLossChart() {

    const canvas =
        document.getElementById("winLossChart");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const trades =
        getTrades();


    const wins =
        trades.filter(
            trade => trade.result === "WIN"
        ).length;


    const losses =
        trades.filter(
            trade => trade.result === "LOSS"
        ).length;


    const total =
        wins + losses;


    canvas.width =
        canvas.clientWidth || 600;


    canvas.height = 300;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (total === 0) {

        ctx.font =
            "16px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "Complete WIN / LOSS trades to see the chart",
            canvas.width / 2,
            canvas.height / 2
        );

        return;
    }


    const centerX =
        canvas.width / 2;


    const centerY =
        canvas.height / 2;


    const radius =
        Math.min(
            canvas.width,
            canvas.height
        ) * 0.30;


    const winAngle =
        (wins / total) *
        Math.PI *
        2;


    let startAngle = -Math.PI / 2;


    // WIN section
    ctx.beginPath();

    ctx.moveTo(
        centerX,
        centerY
    );

    ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        startAngle + winAngle
    );

    ctx.closePath();

    ctx.fill();


    // LOSS section
    ctx.beginPath();

    ctx.moveTo(
        centerX,
        centerY
    );

    ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle + winAngle,
        startAngle + Math.PI * 2
    );

    ctx.closePath();

    ctx.fill();


    ctx.font =
        "16px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        "Wins: " + wins,
        centerX,
        centerY + radius + 30
    );


    ctx.fillText(
        "Losses: " + losses,
        centerX,
        centerY + radius + 55
    );
}


// =====================================
// EQUITY CURVE
// =====================================

function drawEquityCurve() {

    const canvas =
        document.getElementById("equityChart");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const trades =
        getTrades();


    const completed =
        trades.filter(
            trade =>
                trade.result === "WIN" ||
                trade.result === "LOSS"
        );


    canvas.width =
        canvas.clientWidth || 600;


    canvas.height =
        300;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (completed.length === 0) {

        ctx.font =
            "16px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "Complete a WIN or LOSS trade to see the Equity Curve",
            canvas.width / 2,
            canvas.height / 2
        );

        return;
    }


    let equity = 0;


    const points = [0];


    completed.forEach(trade => {

        equity +=
            getTradePL(trade);

        points.push(equity);
    });


    const padding = 40;


    const min =
        Math.min(...points, 0);


    const max =
        Math.max(...points, 0);


    const range =
        max - min || 1;


    ctx.beginPath();


    points.forEach(
        (value, index) => {

            const x =
                padding +
                (
                    index /
                    (points.length - 1)
                ) *
                (
                    canvas.width -
                    padding * 2
                );


            const y =
                padding +
                (
                    (max - value) /
                    range
                ) *
                (
                    canvas.height -
                    padding * 2
                );


            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    );


    ctx.stroke();


    ctx.font =
        "14px Arial";


    ctx.textAlign =
        "left";


    ctx.fillText(
        "P/L: $" +
        equity.toFixed(2),
        padding,
        20
    );
}


// =====================================
// INSTRUMENT
// =====================================

function updateInstrumentFields() {

    const instrument =
        document.getElementById("instrument").value;
        const instrumentType = instrument.toLowerCase();


    const box =
        document.getElementById("forexPairBox");


    if (!box) return;


    if (instrumentType === "forex") {

        box.style.display =
            "block";

    } else {

        box.style.display =
            "none";
    }
}


// =====================================
// BREAK-EVEN CALCULATOR
// =====================================

function calculateBreakEven() {

    const entry =
        Number(
            document.getElementById("beEntry").value
        );


    const direction =
        document.getElementById("beDirection").value;


    const lotSize =
        Number(
            document.getElementById("beLotSize").value
        );


    const fees =
        Number(
            document.getElementById("beFees").value
        ) || 0;


    const instrument =
        document.getElementById("beInstrument").value;


    if (
        entry <= 0 ||
        lotSize <= 0
    ) {

        alert(
            "Please enter valid Entry Price and Lot Size."
        );

        return;
    }


    const contractSize =
        instrument === "Gold"
            ? 100
            : 100000;


    const adjustment =
        fees /
        (lotSize * contractSize);


    const breakEven =
        direction === "BUY"
            ? entry + adjustment
            : entry - adjustment;


    const result =
        document.getElementById(
            "breakEvenResult"
        );


    if (result) {

        result.textContent =
            "Break-even Price: " +
            breakEven.toFixed(
                instrument === "Gold"
                    ? 2
                    : 5
            );
    }
}


// =====================================
// PIPS CALCULATOR
// =====================================

function calculatePips() {

    const pair =
        document.getElementById("pipPair").value;


    const entry =
        Number(
            document.getElementById("pipEntry").value
        );


    const stopLoss =
        Number(
            document.getElementById("pipSL").value
        );


    const takeProfit =
        Number(
            document.getElementById("pipTP").value
        );


    if (
        entry <= 0 ||
        stopLoss <= 0 ||
        takeProfit <= 0
    ) {

        alert(
            "Please enter valid prices."
        );

        return;
    }


    const pipSize =
        pair === "USDJPY"
            ? 0.01
            : 0.0001;


    const slPips =
        Math.abs(
            entry - stopLoss
        ) / pipSize;


    const tpPips =
        Math.abs(
            takeProfit - entry
        ) / pipSize;


    const rr =
        slPips > 0
            ? tpPips / slPips
            : 0;


    setText(
        "slPips",
        slPips.toFixed(1) + " pips"
    );


    setText(
        "tpPips",
        tpPips.toFixed(1) + " pips"
    );


    setText(
        "pipRR",
        "1 : " + rr.toFixed(2)
    );
}


// =====================================
// PIP VALUE CALCULATOR
// =====================================

function calculatePipValue() {

    const pair =
        document.getElementById("pipValuePair").value;


    const lotSize =
        Number(
            document.getElementById("pipValueLot").value
        );


    if (
        !Number.isFinite(lotSize) ||
        lotSize <= 0
    ) {

        alert(
            "Please enter a valid Lot Size."
        );

        return;
    }


    const pipSize =
        pair === "USDJPY"
            ? 0.01
            : 0.0001;


    const pipValue =
        100000 *
        pipSize *
        lotSize;


    setText(
        "pipValueResult",
        "$" +
        pipValue.toFixed(2)
    );
}


// =====================================
// TRADING COST
// =====================================

function calculateTradingCost() {

    const lotSize =
        Number(
            document.getElementById("costLotSize").value
        );


    const commission =
        Number(
            document.getElementById("commission").value
        );


    const spreadPips =
        Number(
            document.getElementById("spreadPips").value
        );


    const pipValue =
        Number(
            document.getElementById("costPipValue").value
        );


    if (
        !Number.isFinite(lotSize) ||
        lotSize <= 0 ||
        !Number.isFinite(commission) ||
        commission < 0 ||
        !Number.isFinite(spreadPips) ||
        spreadPips < 0 ||
        !Number.isFinite(pipValue) ||
        pipValue <= 0
    ) {

        alert(
            "Please enter valid values."
        );

        return;
    }


    const spreadCost =
        spreadPips *
        pipValue *
        lotSize;


    const totalCost =
        commission +
        spreadCost;


    setText(
        "spreadCost",
        "Spread Cost: $" +
        spreadCost.toFixed(2)
    );


    setText(
        "totalTradingCost",
        "Total Trading Cost: $" +
        totalCost.toFixed(2)
    );
}


// =====================================
// WINDOW RESIZE
// =====================================

window.addEventListener(
    "resize",
    function () {

        drawEquityCurve();

        drawWinLossChart();
    }
);


// =====================================
// START APP
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateInstrumentFields();

        displayTrades();

        updateStats();

        updateAccount();

        drawEquityCurve();

        drawWinLossChart();
    }
);
function deleteTrade(index) {
    

    const trades = getTrades();

    if (!trades[index]) {
        alert("Trade not found.");
        return;
    }

    if (!confirm("Are you sure you want to delete this trade?")) {
        return;
    }

    trades.splice(index, 1);

    localStorage.setItem("trades", JSON.stringify(trades));

    displayTrades();
    updateStats();
    updateAccount();
    drawEquityCurve();

    alert("Trade deleted successfully.");
}