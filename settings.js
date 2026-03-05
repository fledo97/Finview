let topics = JSON.parse(localStorage.getItem("topics"));

if(!topics){
topics = ["Food","Transport","Rent","Shopping"];
}

function saveTopics(){
localStorage.setItem("topics", JSON.stringify(topics));
}

function renderTopics(){

const list = document.getElementById("topicList");
list.innerHTML = "";

topics.forEach((topic,index)=>{

const li = document.createElement("li");

li.innerHTML = `
${topic} 
<button onclick="deleteTopic(${index})">Delete</button>
`;

list.appendChild(li);

});

}

function addTopic(){

const input = document.getElementById("newTopic");
const value = input.value.trim();

if(value === ""){
return;
}

topics.push(value);

input.value = "";

saveTopics();
renderTopics();

}

function deleteTopic(index){

topics.splice(index,1);

saveTopics();
renderTopics();

}

function goDashboard(){
window.location.href = "index.html";
}

renderTopics();