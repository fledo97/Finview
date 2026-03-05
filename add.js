let topics = JSON.parse(localStorage.getItem("topics")) || [
  "Food","Transport","Rent","Shopping","Salary"
];

let selectedMonth = null;

// ================= STORAGE =================

function getTransactions(){
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

function setTransactions(data){
  localStorage.setItem("transactions", JSON.stringify(data));
}

// ================= DATE NORMALIZER =================

function normalizeDate(dateInput){

  if(!dateInput) return null;

  dateInput = dateInput.trim();

  // formato italiano gg/mm/aaaa
  if(dateInput.includes("/")){
    const parts = dateInput.split("/");
    if(parts.length !== 3) return null;

    const day = parts[0].padStart(2,"0");
    const month = parts[1].padStart(2,"0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  // formato ISO
  if(dateInput.includes("-")){
    return dateInput;
  }

  return null;
}

// ================= UI HELPERS =================

function createTopicSelect(selected=""){
  let options="";
  topics.forEach(topic=>{
    options+=`<option ${topic===selected?"selected":""}>${topic}</option>`;
  });
  return `<select class="topic">${options}</select>`;
}

function createTypeSelect(selected="expense"){
  return `
  <select class="type">
    <option value="expense" ${selected==="expense"?"selected":""}>Expense</option>
    <option value="income" ${selected==="income"?"selected":""}>Income</option>
  </select>`;
}

function clearTable(){
  document.getElementById("expenseTable").innerHTML="";
}

function addRow(data=null){

  // Mostra data in formato italiano nella tabella
  let displayDate = "";

  if(data?.date){
    const [year,month,day] = data.date.split("-");
    displayDate = `${day}/${month}/${year}`;
  }

  let row=document.createElement("tr");

  row.innerHTML=`
  <td>${createTypeSelect(data?.type)}</td>
  <td>${createTopicSelect(data?.topic)}</td>
  <td><input type="text" class="amount" value="${data?.amount||""}"></td>
  <td><input type="text" class="date" placeholder="gg/mm/aaaa" value="${displayDate}"></td>
  <td><input type="text" class="comment" value="${data?.comment||""}"></td>
  <td><button onclick="deleteRow(this)">🗑</button></td>
  `;

  document.getElementById("expenseTable").appendChild(row);
  updateMonthChart();
}

function deleteRow(btn){
  btn.closest("tr").remove();

}

// ================= IMPORT ROBUSTO =================
function pasteExpenses(){

  const textarea = document.getElementById("pasteArea");
  if(!textarea) return;

  const text = textarea.value.trim();
  if(!text) return;

 const lines = text.split(/\r?\n/);
  
  lines.forEach(line => {

    const clean = line.trim();
    if(clean === "") return;

    const parts = clean.split(/\s+/);

    const amount = parseFloat(parts[0].replace(",","."));
    if(isNaN(amount)) return;

    let date = selectedMonth + "-01";
    let comment = "";

    if(parts.length >= 2){

      if(parts[1].match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/) || parts[1].includes("-")){

        date = normalizeDate(parts[1]);
        comment = parts.slice(2).join(" ");

      }else{

        comment = parts.slice(1).join(" ");

      }

    }

    addRow({
      type:"expense",
      topic:"",
      amount:amount,
      date:date,
      comment:comment
    });

  });

  textarea.value="";
}
// ================= BARRA 12 MESI =================

function loadMonthButtons(){

  const container = document.getElementById("monthButtons");
  container.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();

  for(let i=1;i<=12;i++){

    let month = i.toString().padStart(2,"0");
    let fullMonth = `${year}-${month}`;

    let button = document.createElement("button");

    button.textContent = fullMonth;
    button.dataset.month = fullMonth;

    button.onclick = function(){
      selectMonth(fullMonth);
    };

    container.appendChild(button);
  }

  selectedMonth = today.toISOString().slice(0,7);
  selectMonth(selectedMonth);

}

// ================= SELEZIONE MESE =================

function selectMonth(month){

  selectedMonth = month;

  document.querySelectorAll("#monthButtons button")
    .forEach(b => b.classList.remove("activeMonth"));

  const activeBtn = document.querySelector(
    `#monthButtons button[data-month="${month}"]`
  );

  if(activeBtn){
    activeBtn.classList.add("activeMonth");
  }

  clearTable();

  let transactions = getTransactions();

  transactions.forEach(t=>{
    if(t.date && t.date.slice(0,7)===month){
      addRow(t);
    }
  });
updateMonthChart();
}
// ================= SALVATAGGIO =================
function saveTable(){

  let transactions = getTransactions();
  let newTransactions = [];

  // mantieni le transazioni degli altri mesi
  transactions.forEach(t=>{
    if(t.date && t.date.slice(0,7)!==selectedMonth){
      newTransactions.push(t);
    }
  });

  const rows = document.querySelectorAll("#expenseTable tr");

  rows.forEach(row=>{

    const type = row.querySelector(".type").value;
const topic = row.querySelector(".topic").value || "Other";
    const amountRaw = row.querySelector(".amount").value;
    const dateRaw = row.querySelector(".date").value;
    const comment = row.querySelector(".comment").value;

    if(!amountRaw) return;

    const amount = parseFloat(amountRaw.replace(",","."));

    let normalizedDate;

    // se la data è vuota usa il primo giorno del mese
    if(!dateRaw){

      normalizedDate = selectedMonth + "-01";

    }else{

      normalizedDate = normalizeDate(dateRaw);

    }

    if(!normalizedDate) return;

    newTransactions.push({
      type:type,
      topic:topic,
      amount:Number(amount),
      date:normalizedDate,
      comment:comment
    });

  });

  setTransactions(newTransactions);
  
  updateMonthChart();
  
  alert("Mese salvato correttamente");
}

function updateMonthChart(){

const chartCanvas = document.getElementById("monthTopicChart");

  if(!ctx || typeof Chart === "undefined") return;

  const rows = document.querySelectorAll("#expenseTable tr");

  let topicTotals = {};
  let totalIncome = 0;

  rows.forEach(row=>{

    const type = row.querySelector(".type").value;
    const topic = row.querySelector(".topic").value;
    const amount = parseFloat(row.querySelector(".amount").value);

    if(!amount) return;

    if(type==="income"){
      totalIncome += amount;
      return;
    }

    if(!topicTotals[topic]){
      topicTotals[topic] = 0;
    }

    topicTotals[topic] += amount;

  });

  const labels = ["Income", ...Object.keys(topicTotals)];
  const values = [totalIncome, ...Object.values(topicTotals)];

  const colors = labels.map((l,i)=> i===0 ? "#2ecc71" : "#e74c3c");

  if(window.monthChart){
    window.monthChart.destroy();
  }

  window.monthChart = new Chart(chartCanvas,{
    type:"bar",
    data:{
      labels:labels,
      datasets:[{
        data:values,
        backgroundColor:colors
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false}
      },
      scales:{
        y:{beginAtZero:true}
      }
    }
  });

}
// ================= NAV =================

function goDashboard(){
  window.location.href="index.html";
}

function openSettings(){
  window.location.href="settings.html";
}

// INIT

loadMonthButtons();










