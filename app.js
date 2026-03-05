function getTransactions(){
  return JSON.parse(localStorage.getItem("transactions")) || [];
}
function removeInvalidMonths(){

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  let cleaned = transactions.filter(t => {

    if(!t.date) return false;

    const parts = t.date.split("-");

    if(parts.length < 2) return false;

    const month = Number(parts[1]);

    // tieni solo mesi validi
    return month >= 1 && month <= 12;

  });

  localStorage.setItem("transactions", JSON.stringify(cleaned));

}
function fixTransactions(){

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  let fixed = false;

  transactions = transactions.map(t => {

    if(!t.date) return t;

    // se la data non è nel formato corretto
    if(!/^\d{4}-\d{2}-\d{2}$/.test(t.date)){

      let parts = t.date.split("-");

      if(parts.length === 2){

        const year = parts[0];
        const day = parts[1].padStart(2,"0");

        const today = new Date();
        const month = today.toISOString().slice(5,7);

        fixed = true;

        return {
          ...t,
          date: `${year}-${month}-${day}`
        };

      }

    }

    return t;

  });

  if(fixed){
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

}
removeInvalidMonths();
fixTransactions();
let transactions = getTransactions();

const today = new Date();
const currentMonth = today.toISOString().slice(0,7);

let currentIncome = 0;
let currentExpenses = 0;
let monthlyExpenses = {};

transactions.forEach(t => {

  if(!t.date) return;

  const month = t.date.slice(0,7);
  const amount = Number(t.amount);

  if(t.type === "income" && month === currentMonth){
    currentIncome += amount;
  }

  if(t.type === "expense"){

    if(month === currentMonth){
      currentExpenses += amount;
    }

    if(!monthlyExpenses[month]){
      monthlyExpenses[month] = 0;
    }

    monthlyExpenses[month] += amount;
  }

});

let monthsWithExpenses = Object.keys(monthlyExpenses);

let totalExpensesAllMonths = 0;

monthsWithExpenses.forEach(m => {
  totalExpensesAllMonths += monthlyExpenses[m];
});

let averageMonthlyExpenses = monthsWithExpenses.length
  ? totalExpensesAllMonths / monthsWithExpenses.length
  : 0;

let currentMonthExpenseList = transactions
  .filter(t =>
    t.type === "expense" &&
    t.date &&
    t.date.slice(0,7) === currentMonth
  )
  .map(t => Number(t.amount));

let highestExpense = currentMonthExpenseList.length
  ? Math.max(...currentMonthExpenseList)
  : 0;

document.getElementById("income").textContent =
  "€ " + currentIncome.toFixed(2);

document.getElementById("expenses").textContent =
  "€ " + currentExpenses.toFixed(2);

document.getElementById("highest").textContent =
  "€ " + highestExpense.toFixed(2);

document.getElementById("average").textContent =
  "€ " + averageMonthlyExpenses.toFixed(2);


// GRAFICO MENSILE

let monthlyIncome = {};
let monthlyExpense = {};

// inizializza 12 mesi
for(let i=1;i<=12;i++){

  let month = i.toString().padStart(2,"0");
  let key = `${today.getFullYear()}-${month}`;

  monthlyIncome[key] = 0;
  monthlyExpense[key] = 0;
}

transactions.forEach(t=>{

 if(!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return;

  const month = t.date.slice(0,7);
  const amount = Number(t.amount);

  if(t.type === "income"){
    if(monthlyIncome[month] !== undefined){
      monthlyIncome[month] += amount;
    }
  }

  if(t.type === "expense"){
    if(monthlyExpense[month] !== undefined){
      monthlyExpense[month] += amount;
    }
  }

});

const monthLabels = [
"Jan","Feb","Mar","Apr","May","Jun",
"Jul","Aug","Sep","Oct","Nov","Dec"
];

const incomeData = Object.values(monthlyIncome);
const expenseData = Object.values(monthlyExpense);

const ctx = document.getElementById("financeChart");

if(ctx){

  new Chart(ctx,{
    type:"line",
    data:{
      labels: monthLabels,
      datasets:[
        {
          label:"Income",
          data: incomeData,
          borderWidth:2
        },
        {
          label:"Expenses",
          data: expenseData,
          borderWidth:2
        }
      ]
    },
    options:{
      responsive:true,
      scales:{
        y:{
          beginAtZero:true
        }
      }
    }
  });

}
// PIE CHART CATEGORIE ANNO

let categoryTotals = {};

transactions.forEach(t=>{

  if(t.type !== "expense") return;
  if(!t.topic) return;

  const year = new Date(t.date).getFullYear();
  const currentYear = new Date().getFullYear();

  if(year !== currentYear) return;

  if(!categoryTotals[t.topic]){
    categoryTotals[t.topic] = 0;
  }

  categoryTotals[t.topic] += Number(t.amount);

});

const categoryLabels = Object.keys(categoryTotals);
const categoryValues = Object.values(categoryTotals);

const ctxPie = document.getElementById("categoryChart");

if(ctxPie && categoryLabels.length > 0){

new Chart(ctxPie,{
  type:"pie",
  data:{
    labels:categoryLabels,
    datasets:[{
      data:categoryValues
    }]
  },
  options:{
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      tooltip:{
        callbacks:{
          label:function(context){

            const total = categoryValues.reduce((a,b)=>a+b,0);
            const value = context.raw;
            const percent = ((value/total)*100).toFixed(1);

            return `${context.label}: €${value} (${percent}%)`;
          }
        }
      }
    }
  }
});
// MOSTRA DATA
}
function showCurrentDate(){

  const now = new Date();

  const formattedDate = now.toLocaleDateString("en-En",{
   
    day:"numeric",
    month:"numeric",
    year:"numeric"
  });

  const el = document.getElementById("currentDate");

  if(el){
    el.textContent = formattedDate;
  }

}

showCurrentDate();

// NAVIGAZIONE (solo su click)

function openAddPage(){
  window.location.href = "add.html";
}

function openSettings(){
  window.location.href = "settings.html";
}
if("serviceWorker" in navigator){

  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker attivo"));


}

